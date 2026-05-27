import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeBotX — AI Trading Bot Marketplace",
  description: "Automate your crypto trading with AI-powered bots",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
