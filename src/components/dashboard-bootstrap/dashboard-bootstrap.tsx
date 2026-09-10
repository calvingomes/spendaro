"use client";

import { useAppData } from "@/context/app-data-context";
import { Dashboard } from "@/components/dashboard-view/dashboard";
import { LoadingContent } from "@/components/loading-content/loading-content";

interface DashboardBootstrapProps {
  initialModalOpen?: boolean;
  onModalClose?: () => void;
}

export function DashboardBootstrap({ initialModalOpen, onModalClose }: DashboardBootstrapProps = {}) {
  const { state } = useAppData();

  if (state.status !== "ready") return <LoadingContent />;

  return (
    <Dashboard
      user={state.user}
      initialModalOpen={initialModalOpen}
      onModalClose={onModalClose}
    />
  );
}
