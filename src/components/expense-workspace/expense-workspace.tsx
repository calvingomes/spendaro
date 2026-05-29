"use client";

import { useEffect, useState, useTransition } from "react";
import styles from "./expense-workspace.module.css";
import type { Expense } from "@/lib/types";
import { ExpenseAnalytics } from "@/components/expense-analytics/expense-analytics";
import { ExpenseList } from "@/components/expense-list/expense-list";
import { ExpenseModal } from "@/components/expense-modal/expense-modal";
import { saveLocalExpenses, getLocalExpenses, putLocalExpense, deleteLocalExpense } from "@/utils/db";
import { queueAction, processSyncQueue, getQueuedActions } from "@/utils/sync-queue";

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
  const [isPending, startTransition] = useTransition();
  const [defaultType, setDefaultType] = useState<"credit" | "debit" | "savings">("debit");

  useEffect(() => {
    onExpensesChange?.(expenses);
  }, [expenses, onExpensesChange]);

  const syncAndRefresh = async () => {
    const allSynced = await processSyncQueue();
    if (allSynced) {
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
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const isOffline = !navigator.onLine;

          if (isOffline) {
            const isEditing = !!editingExpense;
            const tempId = isEditing ? editingExpense.id : crypto.randomUUID();
            
            const offlineExpense: Expense = {
              id: tempId,
              user_id: editingExpense?.user_id ?? "offline-user",
              label: String(payload.label ?? "").trim(),
              category: String(payload.category ?? "").trim(),
              amount: String(payload.amount ?? "0"),
              type: (payload.type ?? "debit") as "credit" | "debit" | "savings",
              created_at: payload.created_at ?? new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Update local state and IndexedDB cache immediately
            if (isEditing) {
              const updated = expenses.map((e) => (e.id === tempId ? offlineExpense : e));
              setExpenses(updated);
            } else {
              setExpenses([offlineExpense, ...expenses]);
            }
            await putLocalExpense(offlineExpense);

            queueAction(isEditing ? "PUT" : "POST", isEditing ? { ...payload, id: editingExpense.id } : payload as Record<string, unknown>);
            setIsModalOpen(false);
            resolve();
            return;
          }

          const response = await fetch("/api/expenses", {
            method: editingExpense ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editingExpense ? { ...payload, id: editingExpense.id } : payload)
          });

          const body = await response.json();
          if (!response.ok) throw new Error(body.error ?? "Save failed");

          await putLocalExpense(body.expense);

          if (editingExpense) {
            setExpenses((current) => current.map((e) => (e.id === editingExpense.id ? body.expense : e)));
          } else {
            setExpenses((current) => [body.expense, ...current]);
          }
          
          setIsModalOpen(false);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  const handleDelete = async (expenseId: string) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const isOffline = !navigator.onLine;

          if (isOffline) {
            await deleteLocalExpense(expenseId);
            setExpenses((current) => current.filter((e) => e.id !== expenseId));
            queueAction("DELETE", { id: expenseId });
            setIsModalOpen(false);
            resolve();
            return;
          }

          const response = await fetch("/api/expenses", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: expenseId })
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error ?? "Delete failed");
          }

          await deleteLocalExpense(expenseId);
          setExpenses((current) => current.filter((e) => e.id !== expenseId));
          setIsModalOpen(false);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  return (
    <section className={styles.workspace}>
      {activeTab === "add" && expenses.length > 0 && (
        <div className={styles.recentActivity}>
          <h2 className={styles.sectionTitle}>Recent activity</h2>
          <ExpenseList 
            expenses={expenses.slice(0, 10)} 
            onEdit={handleEdit}
            isPending={isPending}
            simple={true}
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
