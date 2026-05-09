"use client";

import { useEffect } from "react";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const isDev =
        process.env.NODE_ENV === "development" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.startsWith("192.168.");

      if (isDev) {
        // Unregister any existing service workers in development to prevent HMR infinite loops
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
            console.log("Unregistered service worker in development mode (by hostname)");
          }
        });
        return;
      }

      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  return <>{children}</>;
}
