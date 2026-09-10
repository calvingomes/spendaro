"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { User as UserIcon } from "lucide-react";
import styles from "./dashboard.module.css";
import { ExpenseWorkspace } from "@/components/expense-workspace/expense-workspace";
import { ExpenseModal } from "@/components/expense-modal/expense-modal";
import { StatsCards } from "@/components/stats-cards/stats-cards";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt/pwa-install-prompt";
import { WhatsNewModal } from "@/components/whats-new-modal/whats-new-modal";
import { DesktopNavigation } from "@/components/desktop-navigation/desktop-navigation";
import { MobileNavigation } from "@/components/mobile-navigation/mobile-navigation";
import { ProfileView } from "@/components/profile-view/profile-view";
import { PotsWorkspace } from "@/components/pots-workspace/pots-workspace";
import { DashboardContext } from "@/context/dashboard-context";
import { useAppData } from "@/context/app-data-context";
import { saveLocalExpenses, putLocalExpense, deleteLocalExpense } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";
import { useExpenseSync } from "@/hooks/use-expense-sync";
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
  const [isPending, setIsPending] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const autoOpenFired = useRef(false);

  const { syncAndRefresh, rollbackByActionId } = useExpenseSync({
    expenses,
    setExpenses,
    onSyncError: setSyncError,
  });

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

  const handleSubmit = async (payload: Partial<Expense>) => {
    setIsPending(true);
    setSyncError(null);

    const isEditing = !!editingExpense;
    const expenseId = editingExpense?.id ?? crypto.randomUUID();
    const optimisticExpense: Expense = {
      id: expenseId,
      user_id: editingExpense?.user_id ?? "offline-user",
      label: String(payload.label ?? "").trim(),
      category: String(payload.category ?? "").trim(),
      amount: Number(payload.amount ?? 0),
      type: (payload.type ?? "debit") as "credit" | "debit" | "savings",
      pot_id: editingExpense?.pot_id ?? null,
      created_at: payload.created_at ?? editingExpense?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const previousExpenses = expenses;
    const nextExpenses = isEditing
      ? expenses.map((e) => e.id === expenseId ? optimisticExpense : e)
      : [optimisticExpense, ...expenses];

    try {
      setExpenses(nextExpenses);
      await putLocalExpense(optimisticExpense);

      const actionId = queueAction(
        isEditing ? "PUT" : "POST",
        { ...payload, id: expenseId } as Record<string, unknown>
      );
      rollbackByActionId.current.set(actionId, previousExpenses);

      closeExpenseModal();
      setIsPending(false);

      setJustAddedId(expenseId);
      setTimeout(() => setJustAddedId(null), 2800);

      void syncAndRefresh();
    } catch (error) {
      setExpenses(previousExpenses);
      await saveLocalExpenses(previousExpenses);
      setIsPending(false);
      throw error;
    }
  };

  const handleDelete = async (expenseId: string) => {
    setIsPending(true);
    setSyncError(null);
    const previousExpenses = expenses;

    try {
      setExpenses(expenses.filter((e) => e.id !== expenseId));
      await deleteLocalExpense(expenseId);

      const actionId = queueAction("DELETE", { id: expenseId });
      rollbackByActionId.current.set(actionId, previousExpenses);

      closeExpenseModal();
      setIsPending(false);
      void syncAndRefresh();
    } catch (error) {
      setExpenses(previousExpenses);
      await saveLocalExpenses(previousExpenses);
      setIsPending(false);
      throw error;
    }
  };

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
            <ExpenseWorkspace syncError={syncError} />
          )}

          {activeTab === "profile" && <ProfileView />}

          {activeTab === "pots" && <PotsWorkspace />}
        </div>

        {!isExpenseModalOpen && <MobileNavigation />}

        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={closeExpenseModal}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          editingExpense={editingExpense}
          isPending={isPending}
          expenses={expenses}
          defaultType={modalDefaultType}
        />

        <PwaInstallPrompt />
        <WhatsNewModal />
      </main>
    </DashboardContext.Provider>
  );
}
