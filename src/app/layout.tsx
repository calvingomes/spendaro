import type { Metadata } from "next";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt/pwa-install-prompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spendaro",
  description: "Personal expense tracker.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Spendaro",
  },
};

export const viewport = {
  themeColor: "#000000",
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
