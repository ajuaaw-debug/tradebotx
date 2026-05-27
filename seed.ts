// ============================================================
// Database Seed — Development & Staging only
// ============================================================
import { PrismaClient, UserRole, UserTier, Exchange, ConnectionMode,
         StrategyCategory, StrategyStatus, Plan, SubStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tradebotx.com' },
    update: {},
    create: {
      clerkId: 'seed_admin_clerk_id',
      email: 'admin@tradebotx.com',
      fullName: 'Platform Admin',
      role: UserRole.ADMIN,
      tier: UserTier.ENTERPRISE,
      twoFaEnabled: true,
    },
  })

  // Demo bot creator
  const creator = await prisma.user.upsert({
    where: { email: 'creator@tradebotx.com' },
    update: {},
    create: {
      clerkId: 'seed_creator_clerk_id',
      email: 'creator@tradebotx.com',
      fullName: 'Demo Creator',
      role: UserRole.BOT_CREATOR,
      tier: UserTier.PRO,
    },
  })

  // Demo free user
  const freeUser = await prisma.user.upsert({
    where: { email: 'demo@tradebotx.com' },
    update: {},
    create: {
      clerkId: 'seed_free_clerk_id',
      email: 'demo@tradebotx.com',
      fullName: 'Demo User',
      role: UserRole.FREE_USER,
      tier: UserTier.FREE,
    },
  })

  // Creator subscription
  await prisma.subscription.upsert({
    where: { userId: creator.id },
    update: {},
    create: {
      userId: creator.id,
      plan: Plan.PRO,
      subStatus: SubStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Sample strategy
  const strategy = await prisma.strategy.create({
    data: {
      creatorId: creator.id,
      name: 'BTC Swing Master v2',
      description: 'Medium-risk Bitcoin swing trading strategy using EMA crossover + RSI confirmation.',
      category: StrategyCategory.SWING_TRADING,
      config: {
        indicators: [
          { type: 'EMA', period: 20, field: 'close' },
          { type: 'EMA', period: 50, field: 'close' },
          { type: 'RSI', period: 14 },
          { type: 'VOLUME', period: 20 }
        ],
        entryRules: [
          { condition: 'EMA_20 > EMA_50', operator: 'AND' },
          { condition: 'RSI < 65', operator: 'AND' },
          { condition: 'volume > volume_avg_20' }
        ],
        exitRules: [
          { type: 'TAKE_PROFIT', pct: 8 },
          { type: 'STOP_LOSS', pct: 4 },
          { type: 'CONDITION', condition: 'EMA_20 < EMA_50' }
        ],
        timeframe: '4h',
        symbols: ['BTCUSDT'],
        orderType: 'MARKET',
        positionSizing: 'FIXED_PCT',
        positionPct: 10
      },
      priceMonthly: 29.99,
      riskScore: 5,
      status: StrategyStatus.ACTIVE,
      isPublic: true,
      publishedAt: new Date(),
    },
  })

  // Strategy stats
  await prisma.strategyStats.create({
    data: {
      strategyId: strategy.id,
      roi30d: 12.4,
      roi90d: 31.7,
      roi1y: 87.3,
      maxDrawdown: -18.2,
      winRate: 0.623,
      sharpeRatio: 1.87,
      profitFactor: 2.14,
      followerCount: 342,
      totalTrades: 891,
    },
  })

  console.log('Seed complete.')
  console.log({ admin: admin.id, creator: creator.id, freeUser: freeUser.id })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
