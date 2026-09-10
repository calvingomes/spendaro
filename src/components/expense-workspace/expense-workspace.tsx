"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import styles from "./expense-workspace.module.css";
import type { Expense } from "@/lib/types";
import { ExpenseList } from "@/components/expense-list/expense-list";
import { RecentActivityList } from "@/components/recent-activity-list/recent-activity-list";
import { ExpenseModal } from "@/components/expense-modal/expense-modal";
import { saveLocalExpenses, putLocalExpense, deleteLocalExpense } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";
import { useDashboard } from "@/context/dashboard-context";
import { useExpenseSync } from "@/hooks/use-expense-sync";

const ExpenseAnalytics = dynamic(
  () => import("@/components/expense-analytics/expense-analytics").then((module) => module.ExpenseAnalytics),
  { ssr: false }
);

export function ExpenseWorkspace() {
  const {
    expenses,
    setExpenses,
    activeTab,
    setActiveTab,
    isExpenseModalOpen,
    editingExpense,
    modalDefaultType,
    openExpenseModal,
    closeExpenseModal,
    justAddedId,
    setJustAddedId,
  } = useDashboard();

  const [isPending, setIsPending] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { syncAndRefresh, rollbackByActionId } = useExpenseSync({
    expenses,
    setExpenses,
    onSyncError: setSyncError,
  });

  const handleEdit = (expense: Expense) => {
    openExpenseModal({ editingExpense: expense });
  };

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
      ? expenses.map((expense) => expense.id === expenseId ? optimisticExpense : expense)
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

      if (!isEditing) {
        setJustAddedId(expenseId);
        setTimeout(() => setJustAddedId(null), 2200);
      }

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
      const nextExpenses = expenses.filter((expense) => expense.id !== expenseId);
      setExpenses(nextExpenses);
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

  return (
    <section className={styles.workspace}>
      {syncError && (
        <p className={styles.syncError} role="status">
          {syncError}
        </p>
      )}

      {activeTab === "home" && expenses.length > 0 && (
        <div className={styles.recentActivity}>
          <h2 className={styles.sectionTitle}>Recent activity</h2>
          <RecentActivityList
            expenses={expenses.slice(0, 10)}
            onEdit={handleEdit}
            isPending={isPending}
            justAddedId={justAddedId}
          />
          {expenses.length > 10 && (
            <div className={styles.seeMoreContainer}>
              <button
                className={styles.seeMoreButton}
                type="button"
                onClick={() => setActiveTab("transactions")}
              >
                See all transactions
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "transactions" && (
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          isPending={isPending}
        />
      )}

      {activeTab === "analytics" && (
        <ExpenseAnalytics expenses={expenses} />
      )}

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
    </section>
  );
}
