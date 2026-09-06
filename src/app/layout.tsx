import type { Metadata } from "next";
import { PwaProvider } from "@/components/pwa-provider/pwa-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xpenses",
  description: "Personal expense tracker.",
  icons: {
    apple: "/apple-icon.png",
  },
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
      <head>
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
          href="/splash/iphone-se.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
          href="/splash/iphone-15.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
          href="/splash/iphone-15-pro-max.png"
        />
      </head>
      <body>
        <PwaProvider>
          {children}
        </PwaProvider>
      </body>
    </html>
  );
}
