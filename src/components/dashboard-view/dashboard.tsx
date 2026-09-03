"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./dashboard.module.css";
import { ExpenseWorkspace } from "@/components/expense-workspace/expense-workspace";
import { StatsCards } from "@/components/stats-cards/stats-cards";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt/pwa-install-prompt";
import { WhatsNewModal } from "@/components/whats-new-modal/whats-new-modal";
import { DesktopNavigation } from "@/components/desktop-navigation/desktop-navigation";
import { MobileNavigation } from "@/components/mobile-navigation/mobile-navigation";
import { ProfileView } from "@/components/profile-view/profile-view";
import { PotsWorkspace } from "@/components/pots-workspace/pots-workspace";
import type { Expense, Pot, NavTab } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

import { getLocalPots, saveLocalPots } from "@/utils/db";


export function Dashboard({
  initialExpenses,
  user
}: {
  initialExpenses: Expense[];
  user: User;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [pots, setPots] = useState<Pot[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>("add");

  useEffect(() => {
    const loadInitialData = async () => {
      const isOffline = typeof window !== "undefined" && !navigator.onLine;

      // 1. Fetch Pots
      if (isOffline) {
        const cachedPots = await getLocalPots();
        if (cachedPots && cachedPots.length > 0) {
          setPots(cachedPots);
        }
      } else {
        try {
          const res = await fetch("/api/pots");
          if (res.ok) {
            const data = await res.json();
            setPots(data);
            await saveLocalPots(data);
          } else {
            const cachedPots = await getLocalPots();
            if (cachedPots && cachedPots.length > 0) setPots(cachedPots);
          }
        } catch (err) {
          console.error("Failed to prefetch pots:", err);
          const cachedPots = await getLocalPots();
          if (cachedPots && cachedPots.length > 0) setPots(cachedPots);
        }
      }

    };

    loadInitialData();
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <Image src="/icons/icon-192x192.png" alt="Xpenses Logo" width={24} height={24} className={styles.brandLogo} unoptimized />
          <div>
            <p className={styles.brandName}>Xpenses</p>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <DesktopNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.mainContent}>
        {activeTab === "add" && (
          <StatsCards expenses={expenses} />
        )}

        {/* ExpenseWorkspace handles global events and indexedDB caching, so we keep it mounted during add, transactions and analytics views */}
        {(activeTab === "add" || activeTab === "transactions" || activeTab === "analytics") && (
          <ExpenseWorkspace 
            initialExpenses={expenses} 
            onExpensesChange={setExpenses} 
            activeTab={activeTab as "add" | "transactions" | "analytics" | "profile"}
            onTabChange={setActiveTab as (tab: "add" | "transactions" | "analytics" | "profile") => void}
          />
        )}

        {activeTab === "profile" && (
          <ProfileView user={user} />
        )}

        {activeTab === "pots" && (
          <PotsWorkspace 
            expenses={expenses} 
            onExpensesChange={setExpenses} 
            pots={pots} 
            onPotsChange={setPots} 
          />
        )}

      </div>

      {/* Mobile Navigation */}
      <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <PwaInstallPrompt />
      <WhatsNewModal />
    </main>
  );
}
