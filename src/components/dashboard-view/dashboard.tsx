"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { ExpenseWorkspace } from "@/components/expense-workspace/expense-workspace";
import { StatsCards } from "@/components/stats-cards/stats-cards";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt/pwa-install-prompt";
import { WhatsNewModal } from "@/components/whats-new-modal/whats-new-modal";
import { DesktopNavigation } from "@/components/desktop-navigation/desktop-navigation";
import { MobileNavigation } from "@/components/mobile-navigation/mobile-navigation";
import { ProfileView } from "@/components/profile-view/profile-view";
import { PotsWorkspace } from "@/components/pots-workspace/pots-workspace";
import { DashboardContext } from "@/context/dashboard-context";
import type { Expense, Pot, NavTab } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export function Dashboard({
  initialExpenses,
  initialPots,
  user
}: {
  initialExpenses: Expense[];
  initialPots: Pot[];
  user: User;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [pots, setPots] = useState<Pot[]>(initialPots);
  const [activeTab, setActiveTab] = useState<NavTab>("add");

  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  useEffect(() => {
    setPots(initialPots);
  }, [initialPots]);

  return (
    <DashboardContext.Provider value={{ user, expenses, setExpenses, pots, setPots, activeTab, setActiveTab }}>
      <main className={styles.page}>
        <header className={styles.topBar}>
          <div className={styles.brand}>
            <Image src="/icons/icon-192x192.png" alt="Xpenses Logo" width={24} height={24} className={styles.brandLogo} unoptimized />
            <div>
              <p className={styles.brandName}>Xpenses</p>
            </div>
          </div>
        </header>

        <DesktopNavigation />

        <div className={styles.mainContent}>
          {activeTab === "add" && (
            <StatsCards />
          )}

          {(activeTab === "add" || activeTab === "transactions" || activeTab === "analytics") && (
            <ExpenseWorkspace />
          )}

          {activeTab === "profile" && (
            <ProfileView />
          )}

          {activeTab === "pots" && (
            <PotsWorkspace />
          )}
        </div>

        <MobileNavigation />

        <PwaInstallPrompt />
        <WhatsNewModal />
      </main>
    </DashboardContext.Provider>
  );
}
