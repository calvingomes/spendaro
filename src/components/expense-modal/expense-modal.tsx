"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { Input } from "@/components/ui/input/input";
import { CategoryPicker } from "@/components/ui/category-picker/category-picker";
import { Button } from "@/components/ui/button/button";
import styles from "./expense-modal.module.css";
import { DEFAULT_CATEGORIES, formatDateForInput, localDateString, parseAmount, normalizeText } from "@/utils/expense-utils";
import type { Expense } from "@/lib/types";

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
  isPending,
  expenses,
  defaultType = "debit"
}: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedCategories, setAddedCategories] = useState<string[]>([]);

  const dateInputRef = useRef<HTMLInputElement>(null);

  const isExpenseMode = useMemo(() => {
    return defaultType === "debit" || (editingExpense && editingExpense.type === "debit");
  }, [defaultType, editingExpense]);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setForm({
          label: editingExpense.label,
          category: editingExpense.category,
          amount: Math.abs(Number.parseFloat(editingExpense.amount) || 0).toString(),
          type: editingExpense.type,
          created_at: formatDateForInput(editingExpense.created_at)
        });
      } else {
        setForm({
          ...emptyForm,
          type: defaultType,
          created_at: formatDateForInput(new Date())
        });
      }
      setErrorMessage(null);
    }
  }, [isOpen, editingExpense, defaultType]);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  // Dynamic list of categories (newly added ones + unique historical + defaults)
  const allCategories = useMemo(() => {
    const base = new Set<string>();

    addedCategories.forEach((cat) => base.add(normalizeText(cat)));
    expenses.forEach((e) => {
      if (e.category) base.add(normalizeText(e.category));
    });
    DEFAULT_CATEGORIES.forEach((cat) => base.add(normalizeText(cat)));

    return Array.from(base).sort((a, b) => a.localeCompare(b));
  }, [expenses, addedCategories]);

  const handleAddCategory = (newCat: string) => {
    const normalized = normalizeText(newCat);
    if (!normalized) return;

    const matchExists = allCategories.some(cat => cat.toLowerCase() === normalized.toLowerCase());
    if (!matchExists) {
      setAddedCategories(current => [normalized, ...current]);
    }

    setForm(current => ({ ...current, category: normalized }));
  };

  // Humanize selected date for micro-link
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Today";
    const today = localDateString();
    const yesterday = localDateString(new Date(Date.now() - 86400000));
    if (dateString === today) return "Today";
    if (dateString === yesterday) return "Yesterday";

    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
    const finalAmount = amountNum;

    const payload = {
      label: normalizedLabel,
      category: normalizedCategory,
      amount: finalAmount.toString(),
      type: form.type,
      created_at: finalCreatedAt
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  const modalTitle = useMemo(() => {
    const action = editingExpense ? "Edit" : "New";
    return isExpenseMode ? `${action} Expense` : `${action} Income`;
  }, [editingExpense, isExpenseMode]);

  const submitButtonLabel = useMemo(() => {
    if (editingExpense) return "Save changes";
    return isExpenseMode ? "Add Expense" : "Add Income";
  }, [editingExpense, isExpenseMode]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
    >
      <form className={styles.form} onSubmit={handleSubmit}>

        {/* Field 1: Large Centered Amount (Numeric keyboard) */}
        <AmountInput 
          value={form.amount} 
          onChange={(val) => setForm((curr) => ({ ...curr, amount: val }))}
          onFocus={handleInputFocus}
        />


        {/* Field 2: Label Input */}
        <Input
          label="Label"
          id="label"
          value={form.label}
          onFocus={handleInputFocus}
          onChange={(val) => setForm((curr) => ({ ...curr, label: val }))}
          placeholder="e.g. Starbucks, Coffee, Salary"
          required
        />

        {/* Field 3: Category Tappable Chips */}
        <CategoryPicker
          value={form.category}
          onChange={(cat) => setForm((curr) => ({ ...curr, category: cat }))}
          categories={allCategories}
          onAddCategory={handleAddCategory}
          onFocus={handleInputFocus}
        />

        {/* Field 4: Unobtrusive Date selector link */}
        <div
          className={styles.dateLinkContainer}
          onClick={() => dateInputRef.current?.showPicker()}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.dateLink}>
            <span className={styles.dateValue}>{formatDateDisplay(form.created_at)}</span>
            <span className={styles.changeAction}> · change</span>
          </div>
          <input
            ref={dateInputRef}
            type="date"
            className={styles.hiddenDateInput}
            value={form.created_at}
            onChange={(e) => setForm((curr) => ({ ...curr, created_at: e.target.value }))}
          />
        </div>

        {/* Footers / Buttons */}
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
              fullWidth={!editingExpense}
            >
              {isPending ? "Saving..." : submitButtonLabel}
            </Button>
          </div>
        </div>

      </form>
    </Modal>
  );
}
