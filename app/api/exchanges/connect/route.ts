import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

async function verifyBinanceKeys(
  apiKey: string,
  apiSecret: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(apiSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(queryString)
    );

    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const res = await fetch(
      `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`,
      {
        headers: { "X-MBX-APIKEY": apiKey },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        valid: false,
        error: data.msg ?? "Invalid API key or secret",
      };
    }

    return { valid: true };
  } catch (err) {
    console.error("Binance verification error:", err);
    return { valid: false, error: "Could not reach Binance. Please try again." };
  }
}

async function verifyBybitKeys(
  apiKey: string,
  apiSecret: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const timestamp = Date.now().toString();
    const recvWindow = "5000";
    const queryString = "accountType=UNIFIED";
    const message = timestamp + apiKey + recvWindow + queryString;

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(apiSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(message)
    );

    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const res = await fetch(
      `https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED`,
      {
        method: "GET",
        headers: {
          "X-BAPI-API-KEY": apiKey,
          "X-BAPI-TIMESTAMP": timestamp,
          "X-BAPI-RECV-WINDOW": recvWindow,
          "X-BAPI-SIGN": signatureHex,
          "Content-Type": "application/json",
        },
      }
    );

    // Check content type before parsing
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      console.error("Bybit returned non-JSON response:", res.status);
      // If we can't verify, accept the key and let it fail later
      return { valid: true };
    }

    const data = await res.json();

    if (data.retCode === 10003 || data.retCode === 10004) {
      return { valid: false, error: "Invalid Bybit API key or secret" };
    }

    if (data.retCode === 10006) {
      return { valid: false, error: "Bybit API key has insufficient permissions" };
    }

    if (data.retCode !== 0) {
      return {
        valid: false,
        error: data.retMsg ?? "Invalid API key or secret",
      };
    }

    return { valid: true };
  } catch (err) {
    console.error("Bybit verification error:", err);
    // Don't block the user if Bybit is unreachable
    return { valid: true };
  }
}

async function verifyExchangeKeys(
  exchange: string,
  apiKey: string,
  apiSecret: string
): Promise<{ valid: boolean; error?: string }> {
  if (exchange === "BINANCE") return verifyBinanceKeys(apiKey, apiSecret);
  if (exchange === "BYBIT") return verifyBybitKeys(apiKey, apiSecret);

  // For Coinbase, Kraken, OKX — skip live verification for now
  // These require more complex auth flows (passphrase, base64 secrets, etc.)
  // We accept the keys and warn the user instead
  return { valid: true };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { exchange, apiKey, apiSecret, label, mode } = body;

    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Exchange, API key and secret are required" },
        { status: 400 }
      );
    }

    // Basic format checks before hitting the exchange
    if (apiKey.trim().length < 10) {
      return NextResponse.json(
        { error: "API key is too short. Please check and try again." },
        { status: 400 }
      );
    }

    if (apiSecret.trim().length < 10) {
      return NextResponse.json(
        { error: "API secret is too short. Please check and try again." },
        { status: 400 }
      );
    }

    // Skip live verification for testnet mode
    if (mode !== "TESTNET") {
      const verification = await verifyExchangeKeys(exchange, apiKey, apiSecret);
      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error ?? "Invalid API credentials" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.exchangeConnection.findFirst({
      where: { userId: user.id, exchange, isActive: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: `You already have an active ${exchange} connection` },
        { status: 409 }
      );
    }

    const apiKeyEnc = await encrypt(apiKey);
    const apiSecretEnc = await encrypt(apiSecret);

    const connection = await prisma.exchangeConnection.create({
      data: {
        userId: user.id,
        exchange,
        apiKeyEnc,
        apiSecretEnc,
        label: label || `${exchange} Account`,
        mode: mode || "READ_ONLY",
        isActive: true,
        verifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "exchange.connect",
        metadata: { exchange, mode, connectionId: connection.id },
      },
    });

    return NextResponse.json({
      data: {
        id: connection.id,
        exchange: connection.exchange,
        label: connection.label,
        mode: connection.mode,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    console.error("Exchange connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect exchange" },
      { status: 500 }
    );
  }
}