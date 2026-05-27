import { ClerkProvider } from "@clerk/nextjs";
import { dark } from '@clerk/ui/themes'
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
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
