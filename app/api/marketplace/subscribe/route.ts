import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { strategyId } = await req.json();
    if (!strategyId) return NextResponse.json({ error: "Strategy ID required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId, status: "ACTIVE", isPublic: true },
    });
    if (!strategy) return NextResponse.json({ error: "Strategy not found" }, { status: 404 });

    // Check already subscribed
    const existing = await prisma.marketplaceSubscription.findFirst({
      where: { subscriberId: user.id, strategyId, subStatus: "ACTIVE" },
    });
    if (existing) return NextResponse.json({ error: "Already subscribed" }, { status: 409 });

    const platformFee = Number(strategy.priceMonthly) * 0.2;

    const sub = await prisma.marketplaceSubscription.create({
      data: {
        subscriberId: user.id,
        strategyId,
        amount: strategy.priceMonthly,
        platformFee,
        subStatus: "ACTIVE",
      },
    });

    // Bump follower count
    await prisma.strategyStats.update({
      where: { strategyId },
      data: { followerCount: { increment: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "marketplace.subscribe",
        metadata: { strategyId, amount: Number(strategy.priceMonthly) },
      },
    });

    return NextResponse.json({ data: { subscriptionId: sub.id } });
  } catch (error) {
    console.error("Marketplace subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { strategyId } = await req.json();
    if (!strategyId) return NextResponse.json({ error: "Strategy ID required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const sub = await prisma.marketplaceSubscription.findFirst({
      where: { subscriberId: user.id, strategyId, subStatus: "ACTIVE" },
    });
    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

    await prisma.marketplaceSubscription.update({
      where: { id: sub.id },
      data: { subStatus: "CANCELED", endedAt: new Date() },
    });

    await prisma.strategyStats.update({
      where: { strategyId },
      data: { followerCount: { decrement: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "marketplace.unsubscribe",
        metadata: { strategyId },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Marketplace unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}