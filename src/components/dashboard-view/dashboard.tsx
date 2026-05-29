"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./dashboard.module.css";
import { ExpenseWorkspace } from "@/components/expense-workspace/expense-workspace";
import { StatsCards } from "@/components/stats-cards/stats-cards";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt/pwa-install-prompt";
import { WhatsNewModal } from "@/components/whats-new-modal/whats-new-modal";
import { Navigation, NavTab } from "@/components/navigation/navigation";
import { ProfileView } from "@/components/profile-view/profile-view";
import type { User } from "@supabase/supabase-js";
import type { Expense } from "@/lib/types";

export function Dashboard({
  initialExpenses,
  user
}: {
  initialExpenses: Expense[];
  user: User;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [activeTab, setActiveTab] = useState<NavTab>("add");

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

      {/* Navigation Switcher */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "add" && (
        <StatsCards expenses={expenses} />
      )}

      {/* ExpenseWorkspace handles global events and indexedDB caching, so we keep it mounted during add, transactions and analytics views */}
      {(activeTab === "add" || activeTab === "transactions" || activeTab === "analytics") && (
        <ExpenseWorkspace 
          initialExpenses={initialExpenses} 
          onExpensesChange={setExpenses} 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === "profile" && (
        <ProfileView user={user} />
      )}

      <PwaInstallPrompt />
      <WhatsNewModal />
    </main>
  );
}
