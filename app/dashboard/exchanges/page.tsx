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
  {
    id: "BINANCE",
    name: "Binance",
    color: "#F0B90B",
    bg: "rgba(240,185,11,0.08)",
    border: "rgba(240,185,11,0.2)",
    url: "https://binance.com",
    steps: [
      "Go to binance.com and log into your account",
      "Click your profile icon (top right) → API Management",
      "Click 'Create API' → choose 'System generated'",
      "Give it a label like 'TradeBotX' and click Next",
      "Complete the security verification",
      "Under API restrictions, enable 'Read Info' only",
      "Disable 'Enable Withdrawals' — this must stay OFF",
      "Copy your API Key and Secret Key below",
    ],
  },
  {
    id: "BYBIT",
    name: "Bybit",
    color: "#F7A600",
    bg: "rgba(247,166,0,0.08)",
    border: "rgba(247,166,0,0.2)",
    url: "https://bybit.com",
    steps: [
      "Go to bybit.com and log into your account",
      "Click your profile icon → API Management",
      "Click 'Create New Key'",
      "Select 'System-generated API Keys'",
      "Set permissions to 'Read-Write' for trading or 'Read Only' for monitoring",
      "Under 'Contract' enable Read permission",
      "Never enable 'Asset transfer' or 'Withdrawal'",
      "Copy your API Key and Secret Key below",
    ],
  },
  {
    id: "COINBASE",
    name: "Coinbase",
    color: "#0052FF",
    bg: "rgba(0,82,255,0.08)",
    border: "rgba(0,82,255,0.2)",
    url: "https://coinbase.com",
    steps: [
      "Go to coinbase.com and log into your account",
      "Click your profile → Settings → API",
      "Click 'New API Key'",
      "Select the portfolios this key can access",
      "Enable 'View' permission for read-only",
      "Enable 'Trade' only if you want live trading",
      "Never enable 'Transfer' permissions",
      "Copy your API Key and Secret below",
    ],
  },
  {
    id: "KRAKEN",
    name: "Kraken",
    color: "#5741D9",
    bg: "rgba(87,65,217,0.08)",
    border: "rgba(87,65,217,0.2)",
    url: "https://kraken.com",
    steps: [
      "Go to kraken.com and log into your account",
      "Click your name (top right) → Security → API",
      "Click 'Add key'",
      "Give it a description like 'TradeBotX'",
      "Under Key Permissions enable 'Query Funds'",
      "Enable 'Create & Modify Orders' only if live trading",
      "Never enable 'Withdraw Funds'",
      "Copy your API Key and Private Key below",
    ],
  },
  {
    id: "OKX",
    name: "OKX",
    color: "#FFFFFF",
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.1)",
    url: "https://okx.com",
    steps: [
      "Go to okx.com and log into your account",
      "Click your profile → API Management",
      "Click 'Create API Key'",
      "Choose 'Trading' as the purpose",
      "Set a passphrase — remember this, you will need it",
      "Enable 'Read' permission for monitoring",
      "Enable 'Trade' only for live trading",
      "Never enable 'Withdraw' permission",
    ],
  },
];

const modeColor: Record<string, string> = {
  READ_ONLY: "#10b981",
  TRADING: "#f59e0b",
  TESTNET: "#6b7280",
};

export default function ExchangesPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
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

  function selectExchange(id: string) {
    setSelectedExchange(id);
    setForm({ ...form, exchange: id, apiKey: "", apiSecret: "", label: "" });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

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

      setSuccess(`${form.exchange} connected successfully!`);
      setShowForm(false);
      setSelectedExchange(null);
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

  const currentExchange = EXCHANGES.find((e) => e.id === form.exchange);
  const connectedIds = connections.map((c) => c.exchange);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 6 }}>
          Exchange Connections
        </h1>
        <p style={{ color: "#6b7280", fontSize: 15 }}>
          Connect your exchange accounts. Your API keys are encrypted with AES-256 before storage.
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          ✓ {success}
        </div>
      )}

      {/* Exchange picker */}
      {!showForm && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", marginBottom: 16 }}>
              Choose an exchange to connect
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {EXCHANGES.map((ex) => {
                const isConnected = connectedIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => !isConnected && selectExchange(ex.id)}
                    disabled={isConnected}
                    style={{
                      background: isConnected ? "rgba(255,255,255,0.03)" : ex.bg,
                      border: `1px solid ${isConnected ? "#1f2937" : ex.border}`,
                      borderRadius: 12,
                      padding: "20px 12px",
                      cursor: isConnected ? "default" : "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.15s",
                      opacity: isConnected ? 0.5 : 1,
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 800, color: isConnected ? "#4b5563" : ex.color }}>
                      {ex.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: isConnected ? "#4b5563" : "#9ca3af", fontWeight: 500 }}>
                      {ex.name}
                    </div>
                    {isConnected && (
                      <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>
                        ✓ Connected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Connection form with step-by-step guide */}
      {showForm && currentExchange && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>

          {/* Left — Step by step guide */}
          <div style={{ background: "#0f0f0f", border: `1px solid ${currentExchange.border}`, borderRadius: 12, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: currentExchange.color }}>
                {currentExchange.name}
              </div>
              
                href={currentExchange.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#6b7280", textDecoration: "none", background: "#1f2937", padding: "4px 10px", borderRadius: 6 }}
              >
                Open {currentExchange.name} ↗
              </a>
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 16 }}>
              How to get your API keys:
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {currentExchange.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: currentExchange.bg,
                    border: `1px solid ${currentExchange.border}`,
                    color: currentExchange.color,
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>
                ⚠️ Security reminder
              </div>
              <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
                Never enable withdrawal permissions. TradeBotX only needs read and trade access. We will never ask for withdrawal access.
              </div>
            </div>
          </div>

          {/* Right — API key form */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "white" }}>
                Enter your API keys
              </h2>
              <button
                onClick={() => { setShowForm(false); setSelectedExchange(null); setError(""); }}
                style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConnect}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
                  Exchange
                </label>
                <div style={{ background: "#1a1a1a", border: `1px solid ${currentExchange.border}`, color: currentExchange.color, padding: "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                  {currentExchange.name}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
                  Connection label <span style={{ color: "#4b5563" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder={`e.g. My ${currentExchange.name} Account`}
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
                  Mode
                </label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14 }}
                >
                  <option value="READ_ONLY">Read Only — monitor only, no trading</option>
                  <option value="TRADING">Trading — live trade execution</option>
                  <option value="TESTNET">Testnet — safe testing environment</option>
                </select>
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
                  autoComplete="off"
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box", fontFamily: "monospace" }}
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
                  autoComplete="off"
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #374151", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box", fontFamily: "monospace" }}
                />
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                  ✕ {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: submitting ? "#374151" : "#7c3aed",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Verifying keys..." : `Connect ${currentExchange.name}`}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setSelectedExchange(null); setError(""); }}
                  style={{ background: "#1f2937", color: "#9ca3af", border: "none", padding: "12px 20px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#4b5563" }}>🔐</span>
                <span style={{ fontSize: 12, color: "#4b5563" }}>
                  Keys are encrypted with AES-256 before being stored. We never store plain text keys.
                </span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connected exchanges list */}
      {!loading && connections.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", marginBottom: 16 }}>
            Connected exchanges
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {connections.map((conn) => {
              const ex = EXCHANGES.find((e) => e.id === conn.exchange);
              return (
                <div
                  key={conn.id}
                  style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: ex?.bg ?? "#1a1a1a",
                      border: `1px solid ${ex?.border ?? "#374151"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, color: ex?.color ?? "white",
                    }}>
                      {conn.exchange.slice(0, 3)}
                    </div>
                    <div>
                      <div style={{ color: "white", fontWeight: 600, fontSize: 15, marginBottom: 3 }}>
                        {conn.label}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        Connected {new Date(conn.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 3 }}>Mode</div>
                      <span style={{ color: modeColor[conn.mode] ?? "white", fontSize: 13, fontWeight: 600 }}>
                        ● {conn.mode.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 3 }}>Status</div>
                      <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>● Verified</span>
                    </div>
                    <button
                      onClick={() => handleRevoke(conn.id)}
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444", padding: "7px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && connections.length === 0 && !showForm && (
        <div style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 48, textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔌</div>
          <div style={{ color: "white", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No exchanges connected yet
          </div>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            Pick an exchange above to get started. It only takes 2 minutes.
          </div>
        </div>
      )}

      {/* Security info */}
      <div style={{ background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 16 }}>
          How we keep your keys safe
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { icon: "🔐", title: "AES-256 encrypted", desc: "Keys are encrypted before touching our database. Plain text keys never exist in storage." },
            { icon: "🚫", title: "No withdrawal access", desc: "We never request withdrawal permissions. Your funds can never leave your exchange." },
            { icon: "📋", title: "Full audit trail", desc: "Every connection, trade, and revocation is logged with timestamps for your records." },
          ].map((item) => (
            <div key={item.title} style={{ padding: 16, background: "#0a0a0a", borderRadius: 8, border: "1px solid #1f2937" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}