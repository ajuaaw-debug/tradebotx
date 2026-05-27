"use client";

import React from "react";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "⬛" },
  { label: "Exchanges", href: "/dashboard/exchanges", icon: "🔌" },
  { label: "Marketplace", href: "/dashboard/marketplace", icon: "🏪" },
  { label: "My Bots", href: "/dashboard/bots", icon: "🤖" },
  { label: "Paper Trading", href: "/dashboard/paper", icon: "📄" },
  { label: "Backtesting", href: "/dashboard/backtest", icon: "📊" },
  { label: "Copy Trading", href: "/dashboard/copy", icon: "📋" },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: "💼" },
  { label: "Alerts", href: "/dashboard/alerts", icon: "🔔" },
];

type Props = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
};

export function SidebarWrapper({ firstName, lastName, email }: Props) {
  const pathname = usePathname();
  return (
    <div style={{ width: 240, background: "#0f0f0f", borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, left: 0, height: "100vh" }}>
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1f2937", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>TradeBotX</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>AI Trading Platform</div>
      </div>
      <div style={{ flex: 1, padding: "0 12px" }}>
        {navItems.map((item) => (
          <a key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, color: pathname === item.href ? "white" : "#9ca3af", background: pathname === item.href ? "#1f2937" : "transparent", textDecoration: "none", fontSize: 14, marginBottom: 2 }}>
            <span>{item.icon}</span>{item.label}
          </a>
        ))}
      </div>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #1f2937", display: "flex", alignItems: "center", gap: 10 }}>
        <UserButton afterSignOutUrl="/" />
        <div>
          <div style={{ fontSize: 13, color: "white", fontWeight: 500 }}>{firstName} {lastName}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{email}</div>
        </div>
      </div>
    </div>
  );
}