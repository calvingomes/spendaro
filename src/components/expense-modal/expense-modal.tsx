"use client";

import { useState, useMemo, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as Label from "@radix-ui/react-label";
import { Plus, Pencil, Trash2, X, ChevronDown } from "lucide-react";
import styles from "./expense-modal.module.css";
import { DEFAULT_CATEGORIES, formatDateForInput, parseAmount } from "../../utils/expense-utils";
import type { Expense } from "@/lib/types";

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

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  editingExpense: Expense | null;
  isPending: boolean;
  expenses: Expense[];
}

export function ExpenseModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete, 
  editingExpense, 
  isPending,
  expenses 
}: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setForm({
          label: editingExpense.label,
          category: editingExpense.category,
          amount: editingExpense.amount,
          type: editingExpense.type,
          created_at: formatDateForInput(editingExpense.created_at)
        });
      } else {
        setForm({
          ...emptyForm,
          created_at: formatDateForInput(new Date())
        });
      }
      setErrorMessage(null);
    }
  }, [isOpen, editingExpense]);

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

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.modalOverlay} />
        <Dialog.Content className={styles.modalCard}>
          <Dialog.Title className={styles.modalTitle}>
            {editingExpense ? "Edit transaction" : "New transaction"}
          </Dialog.Title>
          <Dialog.Description className={styles.visuallyHidden}>
            Fill out the form below to {editingExpense ? "update your" : "add a new"} transaction.
          </Dialog.Description>
          <Dialog.Close className={styles.closeButton}>
            <X size={16} />
          </Dialog.Close>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <Label.Root htmlFor="label">Label</Label.Root>
              <input
                id="label"
                value={form.label}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                placeholder="e.g. Starbucks, Rent, Salary"
                autoFocus
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
                onValueChange={(value: "credit" | "debit") => setForm((current) => ({ ...current, type: value }))}
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
              <div className={styles.footerActions}>
                {editingExpense && (
                  <button 
                    className={styles.deleteButton} 
                    type="button" 
                    onClick={() => onDelete(editingExpense.id)}
                    disabled={isPending}
                  >
                    <Trash2 className={styles.tableIcon} />
                    Delete
                  </button>
                )}
                <button className={styles.primaryButton} type="submit" disabled={isPending}>
                  {isPending ? (
                    "Saving..."
                  ) : editingExpense ? (
                    <>
                      <Pencil className={styles.tableIcon} />
                      Save changes
                    </>
                  ) : (
                    <>
                      <Plus className={styles.tableIcon} />
                      Add expense
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
