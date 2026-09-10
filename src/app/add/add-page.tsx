"use client";

import { useRouter } from "next/navigation";
import { DashboardBootstrap } from "@/components/dashboard-bootstrap/dashboard-bootstrap";

export function AddPage() {
  const router = useRouter();

  return (
    <DashboardBootstrap
      initialModalOpen
      onModalClose={() => router.replace("/dashboard")}
    />
  );
}
