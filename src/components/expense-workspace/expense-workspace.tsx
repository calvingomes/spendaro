"use client";

import { useEffect, useState, useTransition } from "react";
import styles from "./expense-workspace.module.css";
import type { Expense } from "@/lib/types";
import { ExpenseAnalytics } from "@/components/expense-analytics/expense-analytics";
import { ExpenseList } from "@/components/expense-list/expense-list";
import { ExpenseModal } from "@/components/expense-modal/expense-modal";

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
    const openModal = () => {
      setEditingExpense(null);
      setIsModalOpen(true);
    };
    window.addEventListener("spendaro:add-expense", openModal);
    return () => window.removeEventListener("spendaro:add-expense", openModal);
  }, []);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload: Partial<Expense>) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const response = await fetch("/api/expenses", {
            method: editingExpense ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editingExpense ? { ...payload, id: editingExpense.id } : payload)
          });

          const body = await response.json();
          if (!response.ok) throw new Error(body.error ?? "Save failed");

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
          const response = await fetch("/api/expenses", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: expenseId })
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error ?? "Delete failed");
          }

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
        onAdd={() => {
          setEditingExpense(null);
          setIsModalOpen(true);
        }}
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
