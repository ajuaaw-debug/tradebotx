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
      { headers: { "X-MBX-APIKEY": apiKey } }
    );

    const data = await res.json();

    if (!res.ok) {
      return { valid: false, error: data.msg ?? "Invalid API key or secret" };
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

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return { valid: false, error: "Could not reach Bybit. Please try again." };
    }

    const data = await res.json();

    if (data.retCode === 10003 || data.retCode === 10004) {
      return { valid: false, error: "Invalid Bybit API key or secret." };
    }

    if (data.retCode === 10006) {
      return { valid: false, error: "Bybit API key has insufficient permissions." };
    }

    if (data.retCode !== 0) {
      return { valid: false, error: data.retMsg ?? "Invalid Bybit API key or secret." };
    }

    return { valid: true };
  } catch (err) {
    console.error("Bybit verification error:", err);
    return { valid: false, error: "Could not reach Bybit. Please try again." };
  }
}

async function verifyCoinbaseKeys(
  apiKey: string,
  apiSecret: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "GET";
    const path = "/api/v3/brokerage/accounts";
    const message = timestamp + method + path + "";

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

    const res = await fetch(`https://api.coinbase.com${path}`, {
      method,
      headers: {
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signatureHex,
        "CB-ACCESS-TIMESTAMP": timestamp,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        valid: false,
        error: data.error_details ?? data.message ?? "Invalid Coinbase API key or secret.",
      };
    }

    return { valid: true };
  } catch (err) {
    console.error("Coinbase verification error:", err);
    return { valid: false, error: "Could not reach Coinbase. Please try again." };
  }
}

async function verifyKrakenKeys(
  apiKey: string,
  apiSecret: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const path = "/0/private/Balance";
    const nonce = Date.now().toString();
    const postData = `nonce=${nonce}`;

    // Kraken uses base64-decoded secret + SHA-512
    const secretBuffer = Uint8Array.from(atob(apiSecret), (c) => c.charCodeAt(0));

    const encoder = new TextEncoder();
    const sha256 = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(nonce + postData)
    );

    const hmacKey = await crypto.subtle.importKey(
      "raw",
      secretBuffer,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const pathBytes = encoder.encode(path);
    const combined = new Uint8Array(pathBytes.length + new Uint8Array(sha256).length);
    combined.set(pathBytes, 0);
    combined.set(new Uint8Array(sha256), pathBytes.length);

    const signature = await crypto.subtle.sign("HMAC", hmacKey, combined);
    const signatureBase64 = btoa(
      String.fromCharCode(...new Uint8Array(signature))
    );

    const res = await fetch(`https://api.kraken.com${path}`, {
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
      const errMsg = data.error[0] as string;
      if (errMsg.includes("Invalid key") || errMsg.includes("Invalid signature")) {
        return { valid: false, error: "Invalid Kraken API key or secret." };
      }
      if (errMsg.includes("Permission denied")) {
        return { valid: false, error: "Kraken API key has insufficient permissions." };
      }
      return { valid: false, error: errMsg };
    }

    return { valid: true };
  } catch (err) {
    console.error("Kraken verification error:", err);
    return { valid: false, error: "Could not reach Kraken. Please try again." };
  }
}

async function verifyOkxKeys(
  apiKey: string,
  apiSecret: string,
  passphrase?: string
): Promise<{ valid: boolean; error?: string }> {
  if (!passphrase) {
    return { valid: false, error: "OKX requires a passphrase. Please fill in the Passphrase field." };
  }

  try {
    const timestamp = new Date().toISOString();
    const method = "GET";
    const path = "/api/v5/account/balance";
    const message = timestamp + method + path;

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

    const signatureBase64 = btoa(
      String.fromCharCode(...new Uint8Array(signature))
    );

    const res = await fetch(`https://www.okx.com${path}`, {
      method,
      headers: {
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": signatureBase64,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": passphrase,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (data.code !== "0") {
      if (data.code === "50111" || data.code === "50113") {
        return { valid: false, error: "Invalid OKX API key or secret." };
      }
      if (data.code === "50112") {
        return { valid: false, error: "Invalid OKX passphrase." };
      }
      return { valid: false, error: data.msg ?? "Invalid OKX API credentials." };
    }

    return { valid: true };
  } catch (err) {
    console.error("OKX verification error:", err);
    return { valid: false, error: "Could not reach OKX. Please try again." };
  }
}

async function verifyExchangeKeys(
  exchange: string,
  apiKey: string,
  apiSecret: string,
  passphrase?: string
): Promise<{ valid: boolean; error?: string }> {
  switch (exchange) {
    case "BINANCE":  return verifyBinanceKeys(apiKey, apiSecret);
    case "BYBIT":    return verifyBybitKeys(apiKey, apiSecret);
    case "COINBASE": return verifyCoinbaseKeys(apiKey, apiSecret);
    case "KRAKEN":   return verifyKrakenKeys(apiKey, apiSecret);
    case "OKX":      return verifyOkxKeys(apiKey, apiSecret, passphrase);
    default:
      return { valid: false, error: "Unsupported exchange." };
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { exchange, apiKey, apiSecret, label, mode, passphrase } = body;

    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Exchange, API key and secret are required" },
        { status: 400 }
      );
    }

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
      const verification = await verifyExchangeKeys(exchange, apiKey, apiSecret, passphrase);
      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error ?? "Invalid API credentials" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
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