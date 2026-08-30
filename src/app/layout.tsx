import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MathCraft",
  description: "MathCraft Copilot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <nav
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            padding: "16px 24px",
            background: "#0b2a1c",
            borderBottom: "1px solid #14301F",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 14,
          }}
        >
          <Link
            href="/"
            style={{ color: "#ffffff", textDecoration: "none", fontWeight: 600 }}
          >
            Copilot
          </Link>
          <Link
            href="/work"
            style={{ color: "#E8B24D", textDecoration: "none" }}
          >
            Work
          </Link>
          <Link
            href="/rewards"
            style={{ color: "#E8B24D", textDecoration: "none" }}
          >
            Rewards
          </Link>
        </nav>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
