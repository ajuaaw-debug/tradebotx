// ============================================================
// Shared TypeScript types — used across web app + services
// ============================================================

export type UserRole = 'FREE_USER' | 'PRO_USER' | 'BOT_CREATOR' | 'ADMIN'
export type UserTier = 'FREE' | 'PRO' | 'ENTERPRISE'
export type Exchange = 'BINANCE' | 'BYBIT' | 'COINBASE' | 'KRAKEN' | 'OKX'
export type ConnectionMode = 'READ_ONLY' | 'TRADING' | 'TESTNET'
export type BotStatus = 'CREATED' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR' | 'KILL_SWITCHED'
export type TradeSide = 'BUY' | 'SELL'
export type AlertType =
  | 'TRADE_OPENED' | 'TRADE_CLOSED' | 'TP_HIT' | 'SL_HIT'
  | 'KILL_SWITCH_TRIGGERED' | 'DAILY_LOSS_LIMIT'
  | 'WHALE_MOVEMENT' | 'VOLATILITY_WARNING' | 'UNUSUAL_ACTIVITY'
  | 'BOT_ERROR' | 'BOT_STARTED' | 'BOT_STOPPED'

// ---- Dashboard types ----
export interface DashboardStats {
  totalBalance: number
  totalPnl: number
  totalPnlPct: number
  activeBots: number
  paperBots: number
  openTrades: number
  todayPnl: number
  todayPnlPct: number
}

export interface PortfolioAllocation {
  symbol: string
  valueUsd: number
  pct: number
  pnl: number
  pnlPct: number
}

// ---- Strategy types ----
export interface StrategyIndicator {
  type: 'EMA' | 'SMA' | 'RSI' | 'MACD' | 'BB' | 'ATR' | 'VOLUME' | 'STOCH'
  period?: number
  field?: 'close' | 'open' | 'high' | 'low' | 'volume'
  params?: Record<string, number>
}

export interface StrategyRule {
  condition: string
  operator?: 'AND' | 'OR'
}

export interface StrategyExitRule {
  type: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'CONDITION'
  pct?: number
  condition?: string
}

export interface StrategyConfig {
  indicators: StrategyIndicator[]
  entryRules: StrategyRule[]
  exitRules: StrategyExitRule[]
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  symbols: string[]
  orderType: 'MARKET' | 'LIMIT'
  positionSizing: 'FIXED_PCT' | 'FIXED_USDT' | 'KELLY'
  positionPct?: number
  positionUsdt?: number
}

// ---- Trade types ----
export interface TradeSignal {
  botId: string
  symbol: string
  side: TradeSide
  quantity: number
  entryPrice: number
  takeProfitPrice?: number
  stopLossPrice?: number
  reason: string
  timestamp: number
}

// ---- Risk types ----
export interface RiskCheck {
  passed: boolean
  reason?: string
  triggeredRule?: 'KILL_SWITCH' | 'DAILY_LOSS' | 'MAX_LEVERAGE' | 'POSITION_SIZE' | 'VOLATILITY'
}

// ---- Exchange API types ----
export interface ExchangeBalance {
  asset: string
  free: number
  locked: number
  usdValue: number
}

export interface ExchangeOrderResult {
  orderId: string
  symbol: string
  side: TradeSide
  quantity: number
  price: number
  status: 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED' | 'REJECTED'
  timestamp: number
}

// ---- WebSocket message types ----
export interface WsMessage<T = unknown> {
  type: string
  payload: T
  timestamp: number
}

export interface PriceTickPayload {
  symbol: string
  price: number
  change24h: number
  volume24h: number
}

export interface BotStatusPayload {
  botId: string
  status: BotStatus
  currentPnl: number
  currentPnlPct: number
}

// ---- API response wrapper ----
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
