import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spendaro",
  description: "Simple expense tracking dashboard with Supabase auth."
};

export const viewport = {
  themeColor: "#030712"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
