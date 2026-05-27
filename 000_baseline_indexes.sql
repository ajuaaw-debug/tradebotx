-- ============================================================
-- Additional performance indexes beyond Prisma defaults
-- Run after prisma migrate deploy
-- ============================================================

-- Trades: partition candidate for future scale
-- When trades exceed 100M rows, partition by opened_at (monthly)
-- ALTER TABLE trades PARTITION BY RANGE (opened_at);

-- Full-text search on strategies
CREATE INDEX IF NOT EXISTS idx_strategies_fts
  ON strategies USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Audit logs: time-based range scans
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs (created_at DESC);

-- Alerts: dispatcher polls for unsent alerts
CREATE INDEX IF NOT EXISTS idx_alerts_unsent
  ON alerts (is_sent, created_at ASC)
  WHERE is_sent = false;

-- Bot instances: monitor polling
CREATE INDEX IF NOT EXISTS idx_bot_instances_running
  ON bot_instances (status, updated_at DESC)
  WHERE status = 'RUNNING';

-- Strategy marketplace: sort by various metrics (JSON fields will move to columns later)
CREATE INDEX IF NOT EXISTS idx_strategy_stats_roi30d
  ON strategy_stats (roi_30d DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_strategy_stats_followers
  ON strategy_stats (follower_count DESC);
