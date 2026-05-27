import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") ?? "followers";
    const search = searchParams.get("search") ?? "";
    const maxRisk = searchParams.get("maxRisk");
    const freeOnly = searchParams.get("freeOnly") === "true";

    const strategies = await prisma.strategy.findMany({
      where: {
        status: "ACTIVE",
        isPublic: true,
        ...(category && category !== "ALL" ? { category: category as never } : {}),
        ...(freeOnly ? { priceMonthly: 0 } : {}),
        ...(maxRisk ? { riskScore: { lte: parseInt(maxRisk) } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        stats: true,
        creator: { select: { fullName: true, avatarUrl: true } },
        mktSubs: {
          where: { subStatus: "ACTIVE" },
          select: { id: true },
        },
      },
      orderBy:
        sort === "roi30d"
          ? { stats: { roi30d: "desc" } }
          : sort === "roi90d"
          ? { stats: { roi90d: "desc" } }
          : sort === "winrate"
          ? { stats: { winRate: "desc" } }
          : sort === "newest"
          ? { publishedAt: "desc" }
          : sort === "price_asc"
          ? { priceMonthly: "asc" }
          : { stats: { followerCount: "desc" } },
    });

    // Check which strategies the current user is subscribed to
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const mySubStrategyIds = dbUser
      ? (
          await prisma.marketplaceSubscription.findMany({
            where: { subscriberId: dbUser.id, subStatus: "ACTIVE" },
            select: { strategyId: true },
          })
        ).map((s) => s.strategyId)
      : [];

    const data = strategies.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      priceMonthly: Number(s.priceMonthly),
      riskScore: s.riskScore,
      creator: s.creator.fullName ?? "TradeBotX Team",
      roi30d: s.stats ? Number(s.stats.roi30d) : null,
      roi90d: s.stats ? Number(s.stats.roi90d) : null,
      roi1y: s.stats ? Number(s.stats.roi1y) : null,
      maxDrawdown: s.stats ? Number(s.stats.maxDrawdown) : null,
      winRate: s.stats ? Number(s.stats.winRate) : null,
      sharpeRatio: s.stats ? Number(s.stats.sharpeRatio) : null,
      profitFactor: s.stats ? Number(s.stats.profitFactor) : null,
      followerCount: s.stats?.followerCount ?? 0,
      totalTrades: s.stats?.totalTrades ?? 0,
      isSubscribed: mySubStrategyIds.includes(s.id),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Marketplace list error:", error);
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
  }
}