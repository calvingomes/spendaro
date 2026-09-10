"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { User as UserIcon } from "lucide-react";
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
import { useAppData } from "@/context/app-data-context";
import type { Expense, NavTab } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export function Dashboard({ user }: { user: User }) {
  const { state, setExpenses, setPots } = useAppData();
  const expenses = state.status === "ready" || state.status === "hydrating" ? state.expenses : [];
  const pots = state.status === "ready" || state.status === "hydrating" ? state.pots : [];

  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<"credit" | "debit">("debit");
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const autoOpenFired = useRef(false);

  useEffect(() => {
    if (!autoOpenFired.current) {
      autoOpenFired.current = true;
      setIsExpenseModalOpen(true);
    }
  }, []);

  const openExpenseModal = useCallback((opts?: { defaultType?: "credit" | "debit"; editingExpense?: Expense | null }) => {
    setEditingExpense(opts?.editingExpense ?? null);
    setModalDefaultType(opts?.defaultType ?? "debit");
    setIsExpenseModalOpen(true);
  }, []);

  const closeExpenseModal = useCallback(() => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
    setActiveTab("home");
  }, []);

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const userName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "User") as string;

  return (
    <DashboardContext.Provider value={{
      user,
      expenses,
      setExpenses,
      pots,
      setPots,
      activeTab,
      setActiveTab,
      isExpenseModalOpen,
      editingExpense,
      modalDefaultType,
      openExpenseModal,
      closeExpenseModal,
      justAddedId,
      setJustAddedId,
    }}>
      <main className={styles.page}>
        <header className={styles.topBar}>
          <div className={styles.brand}>
            <Image src="/icons/icon-192x192.png" alt="Xpenses Logo" width={24} height={24} className={styles.brandLogo} unoptimized />
            <div>
              <p className={styles.brandName}>Xpenses</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => setActiveTab("profile")}
            aria-label="Open profile"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userName}
                width={32}
                height={32}
                className={styles.avatarImg}
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.avatarPlaceholder}>
                <UserIcon size={16} />
              </span>
            )}
          </button>
        </header>

        {!isExpenseModalOpen && <DesktopNavigation />}

        <div className={styles.mainContent}>
          {activeTab === "home" && <StatsCards />}

          {(activeTab === "home" || activeTab === "transactions" || activeTab === "analytics") && (
            <ExpenseWorkspace />
          )}

          {activeTab === "profile" && <ProfileView />}

          {activeTab === "pots" && <PotsWorkspace />}
        </div>

        {!isExpenseModalOpen && <MobileNavigation />}

        <PwaInstallPrompt />
        <WhatsNewModal />
      </main>
    </DashboardContext.Provider>
  );
}
