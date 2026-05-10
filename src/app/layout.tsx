import type { Metadata } from "next";
import { PwaProvider } from "@/components/pwa-provider/pwa-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xpenses",
  description: "Personal expense tracker.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Xpenses",
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
        <PwaProvider>
          {children}
        </PwaProvider>
      </body>
    </html>
  );
}
