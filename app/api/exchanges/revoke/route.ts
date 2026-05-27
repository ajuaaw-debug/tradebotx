import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId } = await req.json();
    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Make sure this connection belongs to this user
    const connection = await prisma.exchangeConnection.findFirst({
      where: { id: connectionId, userId: user.id },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Soft delete — never hard delete exchange connections
    await prisma.exchangeConnection.update({
      where: { id: connectionId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "exchange.revoke",
        metadata: { connectionId, exchange: connection.exchange },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Exchange revoke error:", error);
    return NextResponse.json(
      { error: "Failed to revoke connection" },
      { status: 500 }
    );
  }
}