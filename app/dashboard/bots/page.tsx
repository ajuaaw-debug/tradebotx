"use client";
import React, { useEffect, useState } from "react";

type Bot = {
  id: string;
  status: string;
  paperMode: boolean;
  allocatedCapital: number;
  totalPnl: number;
  createdAt: string;
  strategy: { name: string; category: string };
  exchangeConn: { exchange: string; label: string | null };
  trades: { id: string }[];
};

const statusColor: Record<string, string> = {
  RUNNING: "#10b981",
  PAUSED: "#f59e0b",
  STOPPED: "#6b7280",
  ERROR: "#ef4444",
  CREATED: "#7c3aed",
  KILL_SWITCHED: "#ef4444",
};

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bots")
      .then((r) => r.json())
      .then((res) => {
        setBots(res.data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 6 }}>My Bots</h1>
          <p style={{ color: "#6b7280", fontSize: 15 }}>Manage your active and inactive trading bots.</p>
        </div>
        
          href="/dashboard/marketplace"
          style={{ background: "#7c3aed", color: "white", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none" }}
        >
          + New Bot
        </a>
      </div>

      {loading ? (
        <div style={{ color: "#6b7280", textAlign: "center", padding: "64px 0" }}>Loading bots...</div>
      ) : bots.length === 0 ? (
        <div style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
          <div style={{ color: "white", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No bots yet</div>
          <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
            Browse the marketplace to find a strategy and deploy your first bot.
          </div>
          
            href="/dashboard/marketplace"
            style={{ background: "#7c3aed", color: "white", padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none" }}
          >
            Browse Marketplace
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bots.map((bot) => (
            <div key={bot.id} style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ color: "white", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{bot.strategy.name}</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>{bot.exchangeConn.label || bot.exchangeConn.exchange}</div>
                {bot.paperMode && (
                  <span style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed", fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>PAPER</span>
                )}
              </div>
              <div>
                <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Status</div>
                <span style={{ color: statusColor[bot.status] || "white", fontWeight: 600, fontSize: 14 }}>● {bot.status}</span>
              </div>
              <div>
                <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Capital</div>
                <div style={{ color: "white", fontSize: 14 }}>${Number(bot.allocatedCapital).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Total PnL</div>
                <div style={{ color: Number(bot.totalPnl) >= 0 ? "#10b981" : "#ef4444", fontSize: 14, fontWeight: 600 }}>
                  {Number(bot.totalPnl) >= 0 ? "+" : ""}${Number(bot.totalPnl).toFixed(2)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {bot.status === "RUNNING" && (
                  <button style={{ background: "#1f2937", border: "none", color: "#f59e0b", padding: "8px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Pause</button>
                )}
                {bot.status === "PAUSED" && (
                  <button style={{ background: "#1f2937", border: "none", color: "#10b981", padding: "8px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Resume</button>
                )}
                {["RUNNING", "PAUSED"].includes(bot.status) && (
                  <button style={{ background: "#1f2937", border: "none", color: "#ef4444", padding: "8px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Stop</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}