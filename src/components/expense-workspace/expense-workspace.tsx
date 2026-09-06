"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "./expense-workspace.module.css";
import type { Expense } from "@/lib/types";
import { ExpenseList } from "@/components/expense-list/expense-list";
import { RecentActivityList } from "@/components/recent-activity-list/recent-activity-list";
import { ExpenseModal } from "@/components/expense-modal/expense-modal";
import { saveLocalExpenses, getLocalExpenses, putLocalExpense, deleteLocalExpense } from "@/utils/db";
import { queueAction, processSyncQueue, getQueuedActions } from "@/utils/sync-queue";

const ExpenseAnalytics = dynamic(
  () => import("@/components/expense-analytics/expense-analytics").then((module) => module.ExpenseAnalytics),
  { ssr: false }
);

export function ExpenseWorkspace({
  initialExpenses,
  onExpensesChange,
  activeTab = "transactions",
  onTabChange
}: {
  initialExpenses: Expense[];
  onExpensesChange?: (expenses: Expense[]) => void;
  activeTab?: "add" | "transactions" | "analytics" | "profile";
  onTabChange?: (tab: "add" | "transactions" | "analytics" | "profile") => void;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const rollbackByActionId = useRef(new Map<string, Expense[]>());
  const [defaultType, setDefaultType] = useState<"credit" | "debit" | "savings">("debit");

  useEffect(() => {
    onExpensesChange?.(expenses);
  }, [expenses, onExpensesChange]);

  const syncAndRefresh = async () => {
    const result = await processSyncQueue();

    if (result.failedActionIds.length > 0) {
      const rollback = result.failedActionIds
        .map((id) => rollbackByActionId.current.get(id))
        .find((snapshot): snapshot is Expense[] => Boolean(snapshot));

      if (rollback) {
        setExpenses(rollback);
        await saveLocalExpenses(rollback);
      }

      result.failedActionIds.forEach((id) => rollbackByActionId.current.delete(id));
      setSyncError("Couldn't sync the latest change. Your previous data was restored.");
    }

    // Do not refresh from the server while optimistic actions are still queued,
    // otherwise the server response could temporarily hide local changes.
    if (result.remainingCount === 0) {
      try {
        const response = await fetch("/api/expenses");
        if (response.ok) {
          const body = await response.json();
          if (body.expenses) {
            setExpenses(body.expenses);
            await saveLocalExpenses(body.expenses);
          }
        }
      } catch (err) {
        console.error("Failed to refresh expenses after online sync:", err);
      }
    }
  };

  useEffect(() => {
    const initializeLocalCache = async () => {
      const isOffline = typeof window !== "undefined" && !navigator.onLine;
      const hasUnsyncedActions = getQueuedActions().length > 0;

      if (!isOffline && hasUnsyncedActions) {
        // App started online, but has pending offline items. Sync immediately.
        await syncAndRefresh();
        return;
      }

      // If we are offline or have pending offline actions, trust IndexedDB over the cached HTML props
      if (isOffline || hasUnsyncedActions) {
        const cached = await getLocalExpenses();
        if (cached && cached.length > 0) {
          setExpenses(cached);
          return;
        }
      }

      // If online and fully synced, trust the server's fresh data entirely (even if it's empty)
      if (initialExpenses !== undefined) {
        setExpenses(initialExpenses);
        await saveLocalExpenses(initialExpenses);
      }
    };
    initializeLocalCache();
  }, [initialExpenses]);

  useEffect(() => {
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        syncAndRefresh();
      }
    };

    window.addEventListener("online", handleOnlineStatus);
    return () => window.removeEventListener("online", handleOnlineStatus);
  }, []);

  useEffect(() => {
    const openModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ defaultType?: "credit" | "debit" | "savings" }>;
      const dType = customEvent.detail?.defaultType ?? "debit";
      setDefaultType(dType);
      setEditingExpense(null);
      setIsModalOpen(true);
    };
    window.addEventListener("xpenses:add-expense", openModal);
    return () => window.removeEventListener("xpenses:add-expense", openModal);
  }, []);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
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
      amount: String(payload.amount ?? "0"),
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

      setIsModalOpen(false);
      setIsPending(false);

      // Sync after the UI has already reflected the change.
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

      setIsModalOpen(false);
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

      {activeTab === "add" && expenses.length > 0 && (
        <div className={styles.recentActivity}>
          <h2 className={styles.sectionTitle}>Recent activity</h2>
          <RecentActivityList 
            expenses={expenses.slice(0, 10)} 
            onEdit={handleEdit}
            isPending={isPending}
          />
          {expenses.length > 10 && (
            <div className={styles.seeMoreContainer}>
              <button
                className={styles.seeMoreButton}
                type="button"
                onClick={() => onTabChange?.("transactions")}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        editingExpense={editingExpense}
        isPending={isPending}
        expenses={expenses}
        defaultType={defaultType}
      />
    </section>
  );
}
