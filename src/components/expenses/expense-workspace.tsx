"use client";

import { useMemo, useState, useTransition } from "react";
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

export function ExpenseWorkspace({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState<ExpenseFormState>(() => ({
    ...emptyForm,
    created_at: formatDateTimeLocal(new Date())
  }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalSpent = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        const amount = parseAmount(expense.amount);
        return total + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [expenses]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const expense of expenses) {
      counts.set(expense.category, (counts.get(expense.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      created_at: formatDateTimeLocal(new Date())
    });
    setEditingId(null);
    setErrorMessage(null);
  };

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
      <article className={styles.formCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>{editingId ? "Edit expense" : "Add expense"}</p>
            <h2 className={styles.sectionTitle}>{editingId ? "Update the transaction" : "Capture a new expense"}</h2>
          </div>
          <button className={styles.ghostButton} type="button" onClick={resetForm} disabled={isPending}>
            Clear
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
            {errorMessage ? <p className={styles.error}>{errorMessage}</p> : <p className={styles.helper}>Auto-fills today, but you can edit the timestamp.</p>}
          </div>
        </form>
      </article>

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

        <div className={styles.insights}>
          <div className={styles.insightCard}>
            <span className={styles.insightLabel}>Top category</span>
            <strong>{categories[0]?.[0] ?? "None yet"}</strong>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightLabel}>Total spent</span>
            <strong>{formatCurrency(String(totalSpent))}</strong>
          </div>
        </div>
      </article>
    </section>
  );
}
