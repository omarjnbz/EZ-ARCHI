import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EZ-ARCHI — AI Copilot for Moroccan Architects",
  description:
    "Drop client documents in, get a ready-to-sign architect contract out. Powered by AI.",
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
