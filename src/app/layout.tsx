import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
