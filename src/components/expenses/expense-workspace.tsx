"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import styles from "./expense-workspace.module.css";
import type { Expense } from "@/lib/types";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as Label from "@radix-ui/react-label";
import { Plus, ArrowUpRight, ArrowDownLeft, Pencil, Trash2, X, ChevronDown } from "lucide-react";
import { ExpenseAnalytics } from "./expense-analytics";

type ExpenseFormState = {
  label: string;
  category: string;
  amount: string;
  type: "credit" | "debit";
  created_at: string;
};

const emptyForm: ExpenseFormState = {
  label: "",
  category: "",
  amount: "",
  type: "debit",
  created_at: ""
};

const DEFAULT_CATEGORIES = ["Food", "Travel", "Bills", "Entertainment", "Shopping", "Health", "Subscriptions", "Salary", "Gift", "Investment"];

function formatDateForInput(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate())
  ].join("-");
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
    created_at: formatDateForInput(new Date())
  }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const suggestedCategories = useMemo(() => {
    const categoryFreq = new Map<string, number>();
    expenses.forEach((e) => {
      categoryFreq.set(e.category, (categoryFreq.get(e.category) ?? 0) + 1);
    });

    const sortedUsed = [...categoryFreq.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
    const combined = [...new Set([...sortedUsed, ...DEFAULT_CATEGORIES])];

    const search = form.category.toLowerCase().trim();
    if (!search) return combined.slice(0, 5);

    return combined.filter((cat) => cat.toLowerCase().includes(search)).slice(0, 5);
  }, [expenses, form.category]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      created_at: formatDateForInput(new Date())
    });
    setEditingId(null);
    setErrorMessage(null);
  };

  useEffect(() => {
    const openModal = () => {
      setForm({
        ...emptyForm,
        created_at: formatDateForInput(new Date())
      });
      setEditingId(null);
      setErrorMessage(null);
      setIsModalOpen(true);
    };
    window.addEventListener("spendaro:add-expense", openModal);
    return () => window.removeEventListener("spendaro:add-expense", openModal);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    onExpensesChange?.(expenses);
  }, [expenses, onExpensesChange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => 
      e.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const payload = {
      label: form.label.trim().charAt(0).toUpperCase() + form.label.trim().slice(1).toLowerCase(),
      category: form.category.trim().charAt(0).toUpperCase() + form.category.trim().slice(1).toLowerCase(),
      amount: parseAmount(form.amount),
      type: form.type,
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
      type: expense.type,
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
          <div className={styles.sectionActions}>
            <div className={styles.searchBox}>
              <input 
                type="text" 
                placeholder="Search Label or Category..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              className={styles.addPill}
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <Plus className={styles.tableIcon} />
              <span className={styles.btnText}>Add expense</span>
            </button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className={styles.empty}>
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className={styles.labelCell}>{expense.label}</td>
                    <td className={`${styles.amountCell} ${expense.type === "credit" ? "positive" : "negative"}`}>
                      <div className={styles.amountContent}>
                        {expense.type === "credit" ? (
                          <ArrowUpRight className={styles.amountIcon} />
                        ) : (
                          <ArrowDownLeft className={styles.amountIcon} />
                        )}
                        {formatCurrency(expense.amount)}
                      </div>
                    </td>
                    <td>{expense.category}</td>
                    <td>{new Date(expense.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button className={styles.tableButton} type="button" onClick={() => handleEdit(expense)} disabled={isPending} title="Edit">
                          <Pencil className={styles.tableIcon} />
                          <span className={styles.btnText}>Edit</span>
                        </button>
                        <button className={styles.tableButton} type="button" onClick={() => handleDelete(expense.id)} disabled={isPending} title="Delete">
                          <Trash2 className={styles.tableIcon} />
                          <span className={styles.btnText}>Delete</span>
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

      <ExpenseAnalytics expenses={expenses} />

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.modalOverlay} />
          <Dialog.Content className={styles.modalCard}>
            <div className={styles.sectionHeader}>
              <Dialog.Close asChild>
                <button className={styles.closeButton} aria-label="Close">
                  <X className={styles.tableIcon} />
                </button>
              </Dialog.Close>
              <div>
                <Dialog.Title className={styles.modalTitle}>{editingId ? "Update transaction" : "Capture expense"}</Dialog.Title>
                <Dialog.Description className={styles.sectionKicker}>
                  {editingId ? "Edit expense" : "Add expense"}
                </Dialog.Description>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <Label.Root htmlFor="label">Label</Label.Root>
                <input
                  id="label"
                  value={form.label}
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Coffee, Uber, Dinner"
                />
              </div>

              <div className={styles.field}>
                <Label.Root htmlFor="category">Category</Label.Root>
                <div className={styles.comboboxWrapper}>
                  <input
                    id="category"
                    className={styles.combobox}
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    onFocus={() => setIsSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 200)}
                    placeholder="Food, Travel, Bills"
                  />
                  <ChevronDown className={styles.selectIcon} />
                  {isSuggestionsOpen && suggestedCategories.length > 0 && (
                    <ul className={styles.suggestionsList}>
                      {suggestedCategories.map((cat) => (
                        <li key={cat}>
                          <button
                            type="button"
                            className={styles.suggestionItem}
                            onClick={() => {
                              setForm((current) => ({ ...current, category: cat }));
                              setIsSuggestionsOpen(false);
                            }}
                          >
                            {cat}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <Label.Root htmlFor="amount">Amount</Label.Root>
                <input
                  id="amount"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="18.50"
                  inputMode="decimal"
                />
              </div>

              <div className={styles.field}>
                <Label.Root>Type</Label.Root>
                <Select.Root
                  value={form.type}
                  onValueChange={(value) => setForm((current) => ({ ...current, type: value as "credit" | "debit" }))}
                >
                  <Select.Trigger className={`${styles.select} ${form.type === "credit" ? "positive" : "negative"}`}>
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown className={styles.selectIcon} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className={`${styles.suggestionsList} ${styles.selectContent}`} position="popper" sideOffset={4}>
                      <Select.Viewport>
                        <Select.Item value="debit" className={styles.suggestionItem}>
                          <Select.ItemText>Debit</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="credit" className={styles.suggestionItem}>
                          <Select.ItemText>Credit</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className={styles.field}>
                <Label.Root htmlFor="created_at">Created at</Label.Root>
                <input
                  id="created_at"
                  type="date"
                  value={form.created_at}
                  onChange={(event) => setForm((current) => ({ ...current, created_at: event.target.value }))}
                />
              </div>

              <div className={styles.formFooter}>
                {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
                <button className={styles.primaryButton} type="submit" disabled={isPending}>
                  {isPending ? (
                    "Saving..."
                  ) : editingId ? (
                    "Save changes"
                  ) : (
                    <>
                      <Plus className={styles.tableIcon} />
                      Add expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
