import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for duplicate connection
    const existing = await prisma.exchangeConnection.findFirst({
      where: { userId: user.id, exchange, isActive: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: `You already have an active ${exchange} connection` },
        { status: 409 }
      );
    }

    // Encrypt keys before storing
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

    // Log the action
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