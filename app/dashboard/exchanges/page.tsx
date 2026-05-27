"use client";

import { useEffect, useState } from "react";

type Connection = {
  id: string;
  exchange: string;
  label: string;
  mode: string;
  verifiedAt: string;
  createdAt: string;
};

const EXCHANGES = [
  { id: "BINANCE", name: "Binance", color: "#F0B90B" },
  { id: "BYBIT", name: "Bybit", color: "#F7A600" },
  { id: "COINBASE", name: "Coinbase", color: "#0052FF" },
  { id: "KRAKEN", name: "Kraken", color: "#5741D9" },
  { id: "OKX", name: "OKX", color: "#FFFFFF" },
];

export default function ExchangesPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    exchange: "BINANCE",
    apiKey: "",
    apiSecret: "",
    label: "",
    mode: "READ_ONLY",
  });

  async function fetchConnections() {
    try {
      const res = await fetch("/api/exchanges/list");
      const json = await res.json();
      setConnections(json.data ?? []);
    } catch {
      console.error("Failed to fetch connections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConnections();
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/exchanges/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to connect");
        return;
      }

      setSuccess("Exchange connected successfully!");
      setShowForm(false);
      setForm({ exchange: "BINANCE", apiKey: "", apiSecret: "", label: "", mode: "READ_ONLY" });
      fetchConnections();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(connectionId: string) {
    if (!confirm("Are you sure you want to revoke this connection?")) return;

    try {
      const res = await fetch("/api/exchanges/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      }
    } catch {
      alert("Failed to revoke connection");
    }
  }

  const modeColor: Record<string, string> = {
    READ_ONLY: "#10b981",
    TRADING: "#f59e0b",
    TESTNET: "#6b7280",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 6 }}>
            Exchange Connections
          </h1>
          <p style={{ color: "#6b7280", fontSize: 15 }}>
            Connect your exchange accounts securely. Your API keys are encrypted before storage.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
          style={{ background: "#7c3aed", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
        >
          {showForm ? "Cancel" : "+ Connect Exchange"}
        </button>
      </div>

      {success && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {success}
        </div>
      )}

      {showForm && (
        <div style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "white", marginBottom: 24 }}>
            Connect New Exchange
          </h2>

          <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#f59e0b" }}>
            ⚠️ Only use READ ONLY API keys. Never give withdrawal permissions to any trading bot.
          </div>

          <form onSubmit={handleConnect}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
                  Exchange
                </label>
                <select
                  value={form.exchange}
                  onChange={(e) => setForm({ ...form, exchange: e.target.value })}
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14 }}
                >
                  {EXCHANGES.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
                  Mode
                </label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14 }}
                >
                  <option value="READ_ONLY">Read Only (Recommended)</option>
                  <option value="TESTNET">Testnet</option>
                  <option value="TRADING">Trading (Live)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
                Label (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Binance Main Account"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
                API Key
              </label>
              <input
                type="text"
                placeholder="Paste your API key here"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                required
                style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
                API Secret
              </label>
              <input
                type="password"
                placeholder="Paste your API secret here"
                value={form.apiSecret}
                onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
                required
                style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ background: submitting ? "#4b5563" : "#7c3aed", color: "white", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Connecting..." : "Connect Exchange"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ color: "#6b7280", fontSize: 14, padding: "32px 0" }}>Loading connections...</div>
      ) : connections.length === 0 ? (
        <div style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔌</div>
          <div style={{ color: "white", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No exchanges connected</div>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            Connect your first exchange to start using trading bots.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {connections.map((conn) => {
            const ex = EXCHANGES.find((e) => e.id === conn.exchange);
            return (
              <div key={conn.id} style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "#1a1a1a", border: "1px solid #374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: ex?.color ?? "white" }}>
                    {conn.exchange.slice(0, 3)}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                      {conn.label}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      Connected {new Date(conn.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Mode</div>
                    <span style={{ color: modeColor[conn.mode] ?? "white", fontSize: 13, fontWeight: 600 }}>
                      ● {conn.mode.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Status</div>
                    <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>● Verified</span>
                  </div>
                  <button
                    onClick={() => handleRevoke(conn.id)}
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "8px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 32, background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 16 }}>
          Security Information
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { icon: "🔐", title: "AES-256 Encrypted", desc: "Your API keys are encrypted before being stored in our database." },
            { icon: "🚫", title: "No Withdrawal Access", desc: "We never request or store API keys with withdrawal permissions." },
            { icon: "📋", title: "Audit Logged", desc: "Every connection and revocation is logged for your security." },
          ].map((item) => (
            <div key={item.title} style={{ padding: 16, background: "#0a0a0a", borderRadius: 8, border: "1px solid #1f2937" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}