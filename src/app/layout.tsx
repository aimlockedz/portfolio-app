import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockPortfolio - Personal Investment Control Tower",
  description: "Modern personal investment portfolio management optimized for Cloudflare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
