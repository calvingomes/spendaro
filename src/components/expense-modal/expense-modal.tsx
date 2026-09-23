"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { Input } from "@/components/ui/input/input";
import { CategoryPicker } from "@/components/ui/category-picker/category-picker";
import { RectangleToggle } from "@/components/ui/rectangle-toggle/rectangle-toggle";
import { DateInput } from "@/components/ui/date-input/date-input";
import { Button } from "@/components/ui/button/button";
import styles from "./expense-modal.module.css";
import { SPLIT_CATEGORY_TAG, formatDateForInput, parseAmount, normalizeText } from "@/utils/expense-utils";
import type { Expense } from "@/lib/types";
import { useDashboard } from "@/context/dashboard-context";

type ExpenseFormState = {
  label: string;
  category: string;
  amount: string;
  type: "credit" | "debit" | "savings";
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
  onSubmit: (payload: Partial<Expense>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  editingExpense: Expense | null;
  prefillFrom?: Expense | null;
  isPending: boolean;
  expenses: Expense[];
  defaultType?: "credit" | "debit" | "savings";
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  editingExpense,
  prefillFrom,
  isPending,
  expenses,
  defaultType = "debit"
}: ExpenseModalProps) {
  const { categories, addCategory, removeCategory } = useDashboard();
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setForm({
          label: editingExpense.label,
          category: editingExpense.category,
          amount: Math.abs(editingExpense.amount || 0).toString(),
          type: editingExpense.type,
          created_at: formatDateForInput(editingExpense.created_at)
        });
      } else if (prefillFrom) {
        setForm({
          label: prefillFrom.label,
          category: prefillFrom.category,
          amount: Math.abs(prefillFrom.amount || 0).toString(),
          type: prefillFrom.type === "savings" ? "debit" : prefillFrom.type,
          created_at: formatDateForInput(new Date())
        });
      } else {
        setForm({
          ...emptyForm,
          type: defaultType === "savings" ? "debit" : defaultType,
          created_at: formatDateForInput(new Date())
        });
      }
      setErrorMessage(null);
    }
  }, [isOpen, editingExpense, prefillFrom, defaultType]);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const allCategories = useMemo(() => {
    const base = new Set(categories);
    if (editingExpense?.category && editingExpense.category !== SPLIT_CATEGORY_TAG) {
      base.add(editingExpense.category);
    }
    if (prefillFrom?.category && prefillFrom.category !== SPLIT_CATEGORY_TAG) {
      base.add(prefillFrom.category);
    }
    const list = Array.from(base).filter(Boolean);
    const selected = editingExpense?.category;
    if (selected && selected !== SPLIT_CATEGORY_TAG) {
      return [selected, ...list.filter((c) => c !== selected)];
    }
    return list;
  }, [categories, editingExpense, prefillFrom]);

  const handleAddCategory = (newCat: string) => {
    addCategory(newCat);
    setForm(current => ({ ...current, category: normalizeText(newCat) }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const amountNum = parseAmount(form.amount);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Enter a valid transaction amount.");
      return;
    }

    const normalizedLabel = normalizeText(form.label);
    if (!normalizedLabel) {
      setErrorMessage("Fill in the transaction label.");
      return;
    }

    const normalizedCategory = normalizeText(form.category);
    if (!normalizedCategory) {
      setErrorMessage("Select a category chip.");
      return;
    }

    let finalCreatedAt: string | undefined;
    if (form.created_at) {
      if (editingExpense && formatDateForInput(editingExpense.created_at) === form.created_at) {
        finalCreatedAt = editingExpense.created_at;
      } else {
        const now = new Date();
        const [year, month, day] = form.created_at.split("-").map(Number);
        const combinedDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        finalCreatedAt = combinedDate.toISOString();
      }
    }

    addCategory(normalizedCategory);

    const payload = {
      label: normalizedLabel,
      category: normalizedCategory,
      amount: amountNum,
      type: form.type,
      created_at: finalCreatedAt
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  const modalTitle = editingExpense
    ? `Edit ${editingExpense.type === "credit" ? "Income" : "Expense"}`
    : "New Transaction";

  const submitButtonLabel = editingExpense ? "Save changes" : "Add Transaction";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
    >
      <form className={styles.form} onSubmit={handleSubmit}>

        <AmountInput
          value={form.amount}
          onChange={(val) => setForm((curr) => ({ ...curr, amount: val }))}
          onFocus={handleInputFocus}
        />

        <Input
          label="Label"
          id="label"
          value={form.label}
          onFocus={handleInputFocus}
          onChange={(val) => setForm((curr) => ({ ...curr, label: val }))}
          placeholder="e.g. Starbucks, Coffee, Salary"
          required
        />

        <CategoryPicker
          value={form.category}
          onChange={(cat) => setForm((curr) => ({ ...curr, category: cat }))}
          categories={allCategories}
          onAddCategory={handleAddCategory}
          onRemoveCategory={(cat) => {
            removeCategory(cat);
            if (form.category === cat) setForm((curr) => ({ ...curr, category: "" }));
          }}
          onFocus={handleInputFocus}
        />

        {(form.type === "debit" || form.type === "credit") && (
          <RectangleToggle
            options={[
              { value: "debit", label: "Expense" },
              { value: "credit", label: "Income" },
            ]}
            value={form.type}
            onChange={(val) => setForm((curr) => ({ ...curr, type: val as "credit" | "debit" }))}
            colorMap={{ debit: "red", credit: "green" }}
          />
        )}

        <DateInput
          value={form.created_at}
          onChange={(val) => setForm((curr) => ({ ...curr, created_at: val }))}
        />

        <div className={styles.formFooter}>
          {errorMessage && <p className={styles.error}>{errorMessage}</p>}
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
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={
                isPending ||
                !form.label.trim() ||
                !form.category.trim() ||
                !form.amount || parseAmount(form.amount) <= 0
              }
              icon={isPending ? undefined : editingExpense ? <Pencil className={styles.tableIcon} /> : <Plus className={styles.tableIcon} />}
              fullWidth
            >
              {isPending ? "Saving..." : submitButtonLabel}
            </Button>
          </div>
        </div>

      </form>
    </Modal>
  );
}
