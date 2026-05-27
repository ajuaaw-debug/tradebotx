import Link from "next/link";

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{ maxWidth: 700, textAlign: "center" }}>

        <div style={{
          display: "inline-block",
          background: "rgba(168,85,247,0.1)",
          border: "1px solid rgba(168,85,247,0.2)",
          color: "#c084fc",
          fontSize: 13,
          padding: "6px 16px",
          borderRadius: 99,
          marginBottom: 32
        }}>
          MVP in Development
        </div>

        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          marginBottom: 20,
          lineHeight: 1.15,
          color: "white"
        }}>
          AI Trading Bot Marketplace
        </h1>

        <p style={{
          color: "#9ca3af",
          fontSize: 20,
          marginBottom: 48,
          lineHeight: 1.7
        }}>
          Browse, deploy, and profit from AI-powered trading bots.
          Built for serious traders.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 80 }}>
          <Link href="/sign-up" style={{
            background: "#7c3aed",
            color: "white",
            border: "none",
            padding: "12px 32px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-block",
          }}>
            Get Early Access
          </Link>
          <Link href="/sign-in" style={{
            background: "transparent",
            color: "#d1d5db",
            border: "1px solid #374151",
            padding: "12px 32px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-block",
          }}>
            Sign In
          </Link>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 32,
          borderTop: "1px solid #1f2937",
          paddingTop: 48
        }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>500+</div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>Trading strategies</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>5</div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>Exchanges supported</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>AI</div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>Bot generator</div>
          </div>
        </div>

      </div>
    </main>
  );
}
