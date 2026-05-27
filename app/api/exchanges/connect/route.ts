import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

// Test if the API keys actually work by calling the exchange
async function verifyExchangeKeys(
  exchange: string,
  apiKey: string,
  apiSecret: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (exchange === "BINANCE") {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;

      // Create HMAC SHA256 signature
      const encoder = new TextEncoder();
      const keyData = encoder.encode(apiSecret);
      const messageData = encoder.encode(queryString);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
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
        if (data.code === -2014 || data.code === -2015) {
          return { valid: false, error: "Invalid API key or secret" };
        }
        if (data.code === -2008) {
          return { valid: false, error: "Invalid API key format" };
        }
        return { valid: false, error: data.msg ?? "Invalid API credentials" };
      }

      return { valid: true };
    }

    if (exchange === "BYBIT") {
      const timestamp = Date.now().toString();
      const recvWindow = "5000";
      const message = timestamp + apiKey + recvWindow;

      const encoder = new TextEncoder();
      const keyData = encoder.encode(apiSecret);
      const messageData = encoder.encode(message);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
      const signatureHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const res = await fetch(
        "https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED",
        {
          headers: {
            "X-BAPI-API-KEY": apiKey,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recvWindow,
            "X-BAPI-SIGN": signatureHex,
          },
        }
      );

      const data = await res.json();

      if (data.retCode !== 0) {
        return { valid: false, error: data.retMsg ?? "Invalid API credentials" };
      }

      return { valid: true };
    }

    if (exchange === "KRAKEN") {
      const nonce = Date.now().toString();
      const path = "/0/private/Balance";
      const postData = `nonce=${nonce}`;

      const encoder = new TextEncoder();
      const secretBuffer = Uint8Array.from(atob(apiSecret), (c) => c.charCodeAt(0));

      const nonceAndPost = encoder.encode(nonce + postData);
      const sha256 = await crypto.subtle.digest("SHA-256", nonceAndPost);
      const pathBuffer = encoder.encode(path);

      const combined = new Uint8Array(pathBuffer.byteLength + sha256.byteLength);
      combined.set(new Uint8Array(pathBuffer));
      combined.set(new Uint8Array(sha256), pathBuffer.byteLength);

      const hmacKey = await crypto.subtle.importKey(
        "raw",
        secretBuffer,
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );

      const signature = await crypto.subtle.sign("HMAC", hmacKey, combined);
      const signatureBase64 = btoa(
        String.fromCharCode(...new Uint8Array(signature))
      );

      const res = await fetch("https://api.kraken.com/0/private/Balance", {
        method: "POST",
        headers: {
          "API-Key": apiKey,
          "API-Sign": signatureBase64,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: postData,
      });

      const data = await res.json();

      if (data.error && data.error.length > 0) {
        return { valid: false, error: "Invalid API key or secret" };
      }

      return { valid: true };
    }

    if (exchange === "COINBASE") {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = "GET";
      const path = "/api/v3/brokerage/accounts";
      const message = timestamp + method + path;

      const encoder = new TextEncoder();
      const keyData = encoder.encode(apiSecret);
      const messageData = encoder.encode(message);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
      const signatureHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const res = await fetch(`https://api.coinbase.com${path}`, {
        headers: {
          "CB-ACCESS-KEY": apiKey,
          "CB-ACCESS-SIGN": signatureHex,
          "CB-ACCESS-TIMESTAMP": timestamp,
        },
      });

      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: "Invalid API key or secret" };
      }

      return { valid: true };
    }

    if (exchange === "OKX") {
      const timestamp = new Date().toISOString();
      const method = "GET";
      const path = "/api/v5/account/balance";
      const message = timestamp + method + path;

      const encoder = new TextEncoder();
      const keyData = encoder.encode(apiSecret);
      const messageData = encoder.encode(message);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
      const signatureBase64 = btoa(
        String.fromCharCode(...new Uint8Array(signature))
      );

      const res = await fetch(`https://www.okx.com${path}`, {
        headers: {
          "OK-ACCESS-KEY": apiKey,
          "OK-ACCESS-SIGN": signatureBase64,
          "OK-ACCESS-TIMESTAMP": timestamp,
          "OK-ACCESS-PASSPHRASE": "",
        },
      });

      const data = await res.json();

      if (data.code !== "0") {
        return { valid: false, error: "Invalid API key or secret" };
      }

      return { valid: true };
    }

    return { valid: false, error: "Unsupported exchange" };
  } catch (err) {
    console.error("Exchange verification error:", err);
    return { valid: false, error: "Could not reach exchange. Please try again." };
  }
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