"use client";

import { useAppData } from "@/context/app-data-context";
import { Dashboard } from "@/components/dashboard-view/dashboard";
import { LoadingContent } from "@/components/loading-content/loading-content";

export function DashboardBootstrap() {
  const { state } = useAppData();

  if (state.status === "loading" || state.status === "unauthenticated") {
    return <LoadingContent />;
  }

  return <Dashboard user={state.user} />;
}
