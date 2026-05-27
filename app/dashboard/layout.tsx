import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a" }}>

      <aside style={{
        width: 240,
        background: "#0f0f0f",
        borderRight: "1px solid #1f2937",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
      }}>
        <div style={{
          padding: "0 20px 24px",
          borderBottom: "1px solid #1f2937",
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.5px",
          }}>
            TradeBotX
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            AI Trading Platform
          </div>
        </div>

        <nav style={{ flex: 1, padding: "0 12px" }}>
          {[
            { label: "Dashboard", href: "/dashboard", icon: "⬛" },
            { label: "Marketplace", href: "/dashboard/marketplace", icon: "🏪" },
            { label: "My Bots", href: "/dashboard/bots", icon: "🤖" },
            { label: "Paper Trading", href: "/dashboard/paper", icon: "📄" },
            { label: "Backtesting", href: "/dashboard/backtest", icon: "📊" },
            { label: "Copy Trading", href: "/dashboard/copy", icon: "📋" },
            { label: "Portfolio", href: "/dashboard/portfolio", icon: "💼" },
            { label: "Alerts", href: "/dashboard/alerts", icon: "🔔" },
          ].map((item) => (
            
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                color: "#9ca3af",
                textDecoration: "none",
                fontSize: 14,
                marginBottom: 2,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1f2937";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#9ca3af";
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid #1f2937",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <UserButton afterSignOutUrl="/" />
          <div>
            <div style={{ fontSize: 13, color: "white", fontWeight: 500 }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {user.emailAddresses[0]?.emailAddress}
            </div>
          </div>
        </div>
      </aside>

      <main style={{
        marginLeft: 240,
        flex: 1,
        padding: 32,
        color: "white",
      }}>
        {children}
      </main>

    </div>
  );
}
