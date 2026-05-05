"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import styles from "./expense-workspace.module.css";
import type { Expense } from "@/lib/types";

type ExpenseFormState = {
  label: string;
  category: string;
  amount: string;
  created_at: string;
};

const emptyForm: ExpenseFormState = {
  label: "",
  category: "",
  amount: "",
  created_at: ""
};

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateForInput(value: string) {
  return value ? formatDateTimeLocal(new Date(value)) : "";
}

function parseAmount(value: string) {
  return Number.parseFloat(value);
}

function formatCurrency(value: string) {
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

export function ExpenseWorkspace({
  initialExpenses,
  onExpensesChange
}: {
  initialExpenses: Expense[];
  onExpensesChange?: (expenses: Expense[]) => void;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState<ExpenseFormState>(() => ({
    ...emptyForm,
    created_at: formatDateTimeLocal(new Date())
  }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalSpent = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        const amount = parseAmount(expense.amount);
        return total + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [expenses]
  );

  const resetForm = () => {
    setForm({
      ...emptyForm,
      created_at: formatDateTimeLocal(new Date())
    });
    setEditingId(null);
    setErrorMessage(null);
  };

  useEffect(() => {
    const openModal = () => {
      setForm({
        ...emptyForm,
        created_at: formatDateTimeLocal(new Date())
      });
      setEditingId(null);
      setErrorMessage(null);
      setIsModalOpen(true);
    };
    window.addEventListener("spendaro:add-expense", openModal);
    return () => window.removeEventListener("spendaro:add-expense", openModal);
  }, []);

  useEffect(() => {
    onExpensesChange?.(expenses);
  }, [expenses, onExpensesChange]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const payload = {
      label: form.label.trim(),
      category: form.category.trim(),
      amount: parseAmount(form.amount),
      created_at: form.created_at ? new Date(form.created_at).toISOString() : undefined
    };

    if (!payload.label || !payload.category || Number.isNaN(payload.amount)) {
      setErrorMessage("Fill in label, category, and amount.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/expenses", {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload)
        });

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Something went wrong");
        }

        if (editingId) {
          setExpenses((current) => current.map((expense) => (expense.id === editingId ? body.expense : expense)));
        } else {
          setExpenses((current) => [body.expense, ...current]);
        }

        resetForm();
        setIsModalOpen(false);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Save failed");
      }
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      label: expense.label,
      category: expense.category,
      amount: expense.amount,
      created_at: formatDateForInput(expense.created_at)
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (expenseId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/expenses", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: expenseId })
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Delete failed");
        }

        setExpenses((current) => current.filter((expense) => expense.id !== expenseId));

        if (editingId === expenseId) {
          resetForm();
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Delete failed");
      }
    });
  };

  return (
    <section className={styles.workspace}>
      <article className={styles.listCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Expense list</p>
            <h2 className={styles.sectionTitle}>Recent transactions</h2>
          </div>
          <div className={styles.summaryPills}>
            <span className={styles.summaryPill}>{expenses.length} entries</span>
            <span className={styles.summaryPill}>{formatCurrency(String(totalSpent))}</span>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className={styles.emptyState}>No expenses yet. Add one on the left to get started.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Category</th>
                  <th>Created</th>
                  <th className={styles.numeric}>Amount</th>
                  <th className={styles.numeric}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className={styles.labelCell}>{expense.label}</td>
                    <td>{expense.category}</td>
                    <td>{new Date(expense.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className={styles.amountCell}>{formatCurrency(expense.amount)}</td>
                    <td className={styles.numeric}>
                      <div className={styles.actionsCell}>
                        <button className={styles.tableButton} type="button" onClick={() => handleEdit(expense)} disabled={isPending}>
                          Edit
                        </button>
                        <button className={styles.tableButton} type="button" onClick={() => handleDelete(expense.id)} disabled={isPending}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </article>

      {isModalOpen ? (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <article className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>{editingId ? "Edit expense" : "Add expense"}</p>
                <h2 className={styles.modalTitle}>{editingId ? "Update transaction" : "Capture expense"}</h2>
              </div>
              <button className={styles.ghostButton} type="button" onClick={() => setIsModalOpen(false)} disabled={isPending}>
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>Label</span>
                <input
                  value={form.label}
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Coffee, Uber, Dinner"
                />
              </label>

              <label className={styles.field}>
                <span>Category</span>
                <input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Food, Travel, Bills"
                />
              </label>

              <label className={styles.field}>
                <span>Amount</span>
                <input
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="18.50"
                  inputMode="decimal"
                />
              </label>

              <label className={styles.field}>
                <span>Created at</span>
                <input
                  type="datetime-local"
                  value={form.created_at}
                  onChange={(event) => setForm((current) => ({ ...current, created_at: event.target.value }))}
                />
              </label>

              <div className={styles.formFooter}>
                <button className={styles.primaryButton} type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editingId ? "Save changes" : "Add expense"}
                </button>
                {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  );
}
