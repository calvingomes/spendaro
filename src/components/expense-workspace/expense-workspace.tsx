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
  onExpensesChange
}: {
  initialExpenses: Expense[];
  onExpensesChange?: (expenses: Expense[]) => void;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onExpensesChange?.(expenses);
  }, [expenses, onExpensesChange]);

  useEffect(() => {
    const initializeLocalCache = async () => {
      const isOffline = typeof window !== "undefined" && !navigator.onLine;
      const hasUnsyncedActions = getQueuedActions().length > 0;

      // If we are offline or have pending offline actions, trust IndexedDB over the cached HTML props
      if (isOffline || hasUnsyncedActions) {
        const cached = await getLocalExpenses();
        if (cached && cached.length > 0) {
          setExpenses(cached);
          return;
        }
      }

      // If online and fully synced, trust the server's fresh data and update local cache
      if (initialExpenses && initialExpenses.length > 0) {
        setExpenses(initialExpenses);
        await saveLocalExpenses(initialExpenses);
      } else {
        const cached = await getLocalExpenses();
        if (cached && cached.length > 0) {
          setExpenses(cached);
        }
      }
    };
    initializeLocalCache();
  }, [initialExpenses]);

  useEffect(() => {
    const handleOnlineStatus = async () => {
      if (navigator.onLine) {
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
      }
    };

    window.addEventListener("online", handleOnlineStatus);
    return () => window.removeEventListener("online", handleOnlineStatus);
  }, []);

  useEffect(() => {
    const openModal = () => {
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
            const tempId = isEditing ? editingExpense.id : `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            const offlineExpense: Expense = {
              id: tempId,
              user_id: editingExpense?.user_id ?? "offline-user",
              label: String(payload.label ?? "").trim(),
              category: String(payload.category ?? "").trim(),
              amount: String(payload.amount ?? "0"),
              type: (payload.type === "credit" ? "credit" : "debit") as "credit" | "debit",
              created_at: payload.created_at ?? new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            await putLocalExpense(offlineExpense);

            if (isEditing) {
              setExpenses((current) => current.map((e) => (e.id === editingExpense.id ? offlineExpense : e)));
            } else {
              setExpenses((current) => [offlineExpense, ...current]);
            }

            queueAction(isEditing ? "PUT" : "POST", isEditing ? { ...payload, id: editingExpense.id } : payload);
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
      <ExpenseList 
        expenses={expenses} 
        onEdit={handleEdit}
        isPending={isPending}
      />

      <ExpenseAnalytics expenses={expenses} />

      <ExpenseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        editingExpense={editingExpense}
        isPending={isPending}
        expenses={expenses}
      />
    </section>
  );
}
