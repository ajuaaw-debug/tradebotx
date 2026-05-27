import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "white",
          marginBottom: 6,
        }}>
          Welcome back, {user?.firstName ?? "Trader"} 👋
        </h1>
        <p style={{ color: "#6b7280", fontSize: 15 }}>
          Here is your trading overview for today.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 32,
      }}>
        {[
          { label: "Total Balance", value: "$0.00", change: "+0%", color: "#10b981" },
          { label: "Total PnL", value: "$0.00", change: "+0%", color: "#10b981" },
          { label: "Active Bots", value: "0", change: "0 running", color: "#6b7280" },
          { label: "Open Trades", value: "0", change: "0 today", color: "#6b7280" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "#0f0f0f",
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: 20,
          }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "white", marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: stat.color }}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}>
        <div style={{
          background: "#0f0f0f",
          border: "1px solid #1f2937",
          borderRadius: 12,
          padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", marginBottom: 16 }}>
            Active Bots
          </h2>
          <div style={{ color: "#4b5563", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
            No bots running yet.{" "}
            <a href="/dashboard/marketplace" style={{ color: "#7c3aed" }}>
              Browse strategies
            </a>
          </div>
        </div>

        <div style={{
          background: "#0f0f0f",
          border: "1px solid #1f2937",
          borderRadius: 12,
          padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", marginBottom: 16 }}>
            Recent Alerts
          </h2>
          <div style={{ color: "#4b5563", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
            No alerts yet. Alerts appear when your bots trade.
          </div>
        </div>
      </div>
    </div>
  );
}
