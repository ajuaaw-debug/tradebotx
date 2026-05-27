"use client";

import { useEffect, useState, useCallback } from "react";

type Strategy = {
  id: string;
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  riskScore: number;
  creator: string;
  roi30d: number | null;
  roi90d: number | null;
  roi1y: number | null;
  maxDrawdown: number | null;
  winRate: number | null;
  sharpeRatio: number | null;
  profitFactor: number | null;
  followerCount: number;
  totalTrades: number;
  isSubscribed: boolean;
};

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "TREND_FOLLOWING", label: "Trend Following" },
  { id: "SWING_TRADING", label: "Swing Trading" },
  { id: "SCALPING", label: "Scalping" },
  { id: "GRID_BOT", label: "Grid Bot" },
  { id: "DCA_BOT", label: "DCA Bot" },
  { id: "MOMENTUM", label: "Momentum" },
  { id: "FUTURES", label: "Futures" },
  { id: "MEME_COIN_SNIPER", label: "Meme Sniper" },
  { id: "ARBITRAGE", label: "Arbitrage" },
];

const SORTS = [
  { id: "followers", label: "Most Popular" },
  { id: "roi30d", label: "Best 30d ROI" },
  { id: "roi90d", label: "Best 90d ROI" },
  { id: "winrate", label: "Highest Win Rate" },
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Price: Low to High" },
];

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  TREND_FOLLOWING:  { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  SWING_TRADING:    { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  SCALPING:         { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  GRID_BOT:         { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  DCA_BOT:          { color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  MOMENTUM:         { color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  FUTURES:          { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  MEME_COIN_SNIPER: { color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  ARBITRAGE:        { color: "#a3e635", bg: "rgba(163,230,53,0.1)" },
};

function riskLabel(score: number) {
  if (score <= 3) return { label: "Low", color: "#10b981" };
  if (score <= 6) return { label: "Medium", color: "#f59e0b" };
  if (score <= 8) return { label: "High", color: "#f97316" };
  return { label: "Very High", color: "#ef4444" };
}

function fmt(n: number | null, suffix = "%") {
  if (n === null || n === 0) return "—";
  return (n > 0 ? "+" : "") + n.toFixed(2) + suffix;
}

function fmtWin(n: number | null) {
  if (n === null) return "—";
  return (n * 100).toFixed(1) + "%";
}

export default function MarketplacePage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("followers");
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [maxRisk, setMaxRisk] = useState("10");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Strategy | null>(null);

  const fetchStrategies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        sort,
        search,
        freeOnly: freeOnly.toString(),
        maxRisk,
      });
      const res = await fetch(`/api/marketplace/strategies?${params}`);
      const json = await res.json();
      setStrategies(json.data ?? []);
    } catch {
      console.error("Failed to fetch strategies");
    } finally {
      setLoading(false);
    }
  }, [category, sort, search, freeOnly, maxRisk]);

  useEffect(() => {
    const t = setTimeout(fetchStrategies, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchStrategies, search]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleSubscribe(strategyId: string, isSubscribed: boolean) {
    setSubscribing(strategyId);
    try {
      const res = await fetch("/api/marketplace/subscribe", {
        method: isSubscribed ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Something went wrong");
        return;
      }
      showToast(isSubscribed ? "Unsubscribed successfully" : "Subscribed successfully!");
      setStrategies((prev) =>
        prev.map((s) =>
          s.id === strategyId
            ? { ...s, isSubscribed: !isSubscribed, followerCount: s.followerCount + (isSubscribed ? -1 : 1) }
            : s
        )
      );
      if (selected?.id === strategyId) {
        setSelected((prev) =>
          prev ? { ...prev, isSubscribed: !isSubscribed, followerCount: prev.followerCount + (isSubscribed ? -1 : 1) } : prev
        );
      }
    } catch {
      showToast("Something went wrong");
    } finally {
      setSubscribing(null);
    }
  }

  const catStyle = (id: string) => ({
    padding: "6px 14px",
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid " + (category === id ? "#7c3aed" : "#1f2937"),
    background: category === id ? "rgba(124,58,237,0.15)" : "transparent",
    color: category === id ? "#a78bfa" : "#6b7280",
  });

  return (
    <div style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, background: "#1f2937", border: "1px solid #374151", color: "white", padding: "12px 20px", borderRadius: 10, fontSize: 14, zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 6 }}>Strategy Marketplace</h1>
          <p style={{ color: "#6b7280", fontSize: 15 }}>Browse and deploy AI-powered trading strategies.</p>
        </div>
        <div style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 20px", textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{strategies.length}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>strategies available</div>
        </div>
      </div>

      {/* Search + Sort */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search strategies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, background: "#0f0f0f", border: "1px solid #1f2937", color: "white", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ background: "#0f0f0f", border: "1px solid #1f2937", color: "white", padding: "10px 14px", borderRadius: 8, fontSize: 14, minWidth: 180 }}
        >
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)} style={catStyle(c.id)}>{c.label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#9ca3af" }}>
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              style={{ accentColor: "#7c3aed" }}
            />
            Free only
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9ca3af" }}>
            Max risk:
            <select
              value={maxRisk}
              onChange={(e) => setMaxRisk(e.target.value)}
              style={{ background: "#0f0f0f", border: "1px solid #1f2937", color: "white", padding: "4px 8px", borderRadius: 6, fontSize: 13 }}
            >
              {[3, 5, 7, 10].map((r) => <option key={r} value={r}>{r <= 3 ? "Low" : r <= 5 ? "Medium" : r <= 7 ? "High" : "Any"}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 24, height: 260, opacity: 0.4, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <div style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 64, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <div style={{ color: "white", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No strategies found</div>
          <div style={{ color: "#6b7280", fontSize: 14 }}>Try adjusting your filters.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {strategies.map((s) => {
            const risk = riskLabel(s.riskScore);
            const catColor = CATEGORY_COLORS[s.category] ?? { color: "#9ca3af", bg: "rgba(156,163,175,0.1)" };
            const isBusy = subscribing === s.id;
            return (
              <div
                key={s.id}
                style={{ background: "#0f0f0f", border: "1px solid " + (s.isSubscribed ? "rgba(124,58,237,0.4)" : "#1f2937"), borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", gap: 14, cursor: "pointer", transition: "border-color 0.2s" }}
                onClick={() => setSelected(s)}
              >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, color: catColor.color, background: catColor.bg }}>
                        {s.category.replace(/_/g, " ")}
                      </span>
                      {s.isSubscribed && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, color: "#a78bfa", background: "rgba(124,58,237,0.15)" }}>
                          ✓ Subscribed
                        </span>
                      )}
                    </div>
                    <div style={{ color: "white", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>by {s.creator}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.priceMonthly === 0 ? "#10b981" : "white" }}>
                      {s.priceMonthly === 0 ? "Free" : "$" + s.priceMonthly + "/mo"}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {s.description}
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "30d ROI", value: fmt(s.roi30d), color: s.roi30d && s.roi30d > 0 ? "#10b981" : s.roi30d && s.roi30d < 0 ? "#ef4444" : "#6b7280" },
                    { label: "Win Rate", value: fmtWin(s.winRate), color: "white" },
                    { label: "Max DD", value: fmt(s.maxDrawdown), color: s.maxDrawdown ? "#ef4444" : "#6b7280" },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "#0a0a0a", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 3 }}>{stat.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Bottom row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6b7280" }}>
                    <span>👥 {s.followerCount.toLocaleString()}</span>
                    <span style={{ color: risk.color }}>⚡ {risk.label} risk</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSubscribe(s.id, s.isSubscribed); }}
                    disabled={isBusy}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: isBusy ? "not-allowed" : "pointer",
                      border: s.isSubscribed ? "1px solid rgba(239,68,68,0.3)" : "none",
                      background: isBusy ? "#374151" : s.isSubscribed ? "rgba(239,68,68,0.08)" : "#7c3aed",
                      color: isBusy ? "#6b7280" : s.isSubscribed ? "#ef4444" : "white",
                    }}
                  >
                    {isBusy ? "..." : s.isSubscribed ? "Unsubscribe" : s.priceMonthly === 0 ? "Add Free" : "Subscribe"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ width: 480, background: "#0f0f0f", borderLeft: "1px solid #1f2937", height: "100%", overflowY: "auto", padding: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                {(() => {
                  const catColor = CATEGORY_COLORS[selected.category] ?? { color: "#9ca3af", bg: "rgba(156,163,175,0.1)" };
                  return (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, color: catColor.color, background: catColor.bg, marginBottom: 10, display: "inline-block" }}>
                      {selected.category.replace(/_/g, " ")}
                    </span>
                  );
                })()}
                <div style={{ color: "white", fontSize: 22, fontWeight: 700, marginTop: 8 }}>{selected.name}</div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>by {selected.creator}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 24, cursor: "pointer" }}>×</button>
            </div>

            {/* Price + subscribe */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 12, padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: selected.priceMonthly === 0 ? "#10b981" : "white" }}>
                  {selected.priceMonthly === 0 ? "Free" : "$" + selected.priceMonthly + "/mo"}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  {selected.followerCount.toLocaleString()} followers · {selected.totalTrades.toLocaleString()} trades
                </div>
              </div>
              <button
                onClick={() => handleSubscribe(selected.id, selected.isSubscribed)}
                disabled={subscribing === selected.id}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: subscribing === selected.id ? "not-allowed" : "pointer",
                  border: selected.isSubscribed ? "1px solid rgba(239,68,68,0.3)" : "none",
                  background: subscribing === selected.id ? "#374151" : selected.isSubscribed ? "rgba(239,68,68,0.08)" : "#7c3aed",
                  color: subscribing === selected.id ? "#6b7280" : selected.isSubscribed ? "#ef4444" : "white",
                }}
              >
                {subscribing === selected.id ? "..." : selected.isSubscribed ? "Unsubscribe" : selected.priceMonthly === 0 ? "Add Free" : "Subscribe"}
              </button>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 10 }}>About this strategy</div>
              <div style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.8 }}>{selected.description}</div>
            </div>

            {/* Full stats */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 12 }}>Performance</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "30d ROI", value: fmt(selected.roi30d), color: selected.roi30d && selected.roi30d > 0 ? "#10b981" : "#ef4444" },
                  { label: "90d ROI", value: fmt(selected.roi90d), color: selected.roi90d && selected.roi90d > 0 ? "#10b981" : "#ef4444" },
                  { label: "1Y ROI", value: fmt(selected.roi1y), color: selected.roi1y && selected.roi1y > 0 ? "#10b981" : "#ef4444" },
                  { label: "Max Drawdown", value: fmt(selected.maxDrawdown), color: "#ef4444" },
                  { label: "Win Rate", value: fmtWin(selected.winRate), color: "white" },
                  { label: "Sharpe Ratio", value: selected.sharpeRatio ? selected.sharpeRatio.toFixed(2) : "—", color: "white" },
                  { label: "Profit Factor", value: selected.profitFactor ? selected.profitFactor.toFixed(2) : "—", color: "white" },
                  { label: "Total Trades", value: selected.totalTrades.toLocaleString(), color: "white" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk */}
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: 16 }}>
              {(() => {
                const risk = riskLabel(selected.riskScore);
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Risk Level</div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: risk.color }}>{risk.label} ({selected.riskScore}/10)</span>
                    </div>
                    <div style={{ height: 6, background: "#1f2937", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: (selected.riskScore / 10 * 100) + "%", background: risk.color, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>
                      Past performance does not guarantee future results. Only invest what you can afford to lose.
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}