"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import styles from "./expense-modal.module.css";
import { DEFAULT_CATEGORIES, formatDateForInput, parseAmount, normalizeText } from "@/utils/expense-utils";
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
  onSubmit: (payload: Partial<Expense>) => Promise<void>;
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
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addedCategories, setAddedCategories] = useState<string[]>([]);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state
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
      setNewCategory("");
      setShowAddCategory(false);
    }
  }, [isOpen, editingExpense]);

  // Autofocus the inline category input when opened
  useEffect(() => {
    if (showAddCategory && newCategoryInputRef.current) {
      newCategoryInputRef.current.focus();
    }
  }, [showAddCategory]);

  // Dynamic list of categories (newly added ones + unique historical + defaults)
  const allCategories = useMemo(() => {
    const base = new Set<string>();
    
    addedCategories.forEach((cat) => base.add(normalizeText(cat)));
    expenses.forEach((e) => {
      if (e.category) base.add(normalizeText(e.category));
    });
    DEFAULT_CATEGORIES.forEach((cat) => base.add(normalizeText(cat)));

    return Array.from(base);
  }, [expenses, addedCategories]);

  // Handles adding an inline custom category chip
  const handleNewCategorySubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    const normalized = normalizeText(newCategory);
    if (!normalized) return;

    const matchExists = allCategories.some(cat => cat.toLowerCase() === normalized.toLowerCase());
    if (!matchExists) {
      setAddedCategories(current => [normalized, ...current]);
    }

    setForm(current => ({ ...current, category: normalized }));
    setNewCategory("");
    setShowAddCategory(false);
  };

  // Humanize selected date for micro-link
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Today";
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
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

    const payload = {
      label: normalizedLabel,
      category: normalizedCategory,
      amount: amountNum.toString(),
      type: form.type,
      created_at: form.created_at ? new Date(form.created_at).toISOString() : undefined
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingExpense ? "Edit transaction" : "New transaction"}
      description={`Fill out the form below to ${editingExpense ? "update your" : "add a new"} transaction.`}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        
        {/* Field 1: Large Centered Amount (Numeric keyboard) */}
        <div className={styles.amountSection}>
          <div className={styles.amountContainer}>
            <span className={styles.currencySymbol}>₹</span>
            <div className={styles.inputWrapper}>
              <span className={styles.mirrorSpan}>
                {form.amount || "0.00"}
              </span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                className={styles.largeAmountInput}
                value={form.amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                    setForm((curr) => ({ ...curr, amount: val }));
                  }
                }}
                placeholder="0.00"
                required
              />
            </div>
          </div>
        </div>

        {/* Field 2: Label Input */}
        <div className={styles.field}>
          <label htmlFor="label">Label</label>
          <input
            id="label"
            type="text"
            className={styles.textInput}
            value={form.label}
            onChange={(e) => setForm((curr) => ({ ...curr, label: e.target.value }))}
            placeholder="e.g. Starbucks, Coffee, Salary"
            required
          />
        </div>

        {/* Field 3: Category Tappable Chips */}
        <div className={styles.field}>
          <label>Category</label>
          <div className={styles.chipsRow}>
            {/* Toggle Plus Button or inline text input on the far left */}
            {showAddCategory ? (
              <div className={styles.inlineCategoryForm}>
                <input
                  ref={newCategoryInputRef}
                  type="text"
                  placeholder="New..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={styles.inlineCategoryInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNewCategorySubmit();
                    }
                    if (e.key === "Escape") {
                      setShowAddCategory(false);
                    }
                  }}
                  onBlur={() => {
                    // Save on blur if has value, else close
                    if (newCategory.trim()) {
                      handleNewCategorySubmit();
                    } else {
                      setShowAddCategory(false);
                    }
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                className={styles.addCategoryChip}
                onClick={() => setShowAddCategory(true)}
                aria-label="Add custom category"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            )}

            {/* Mapped Categories scrollable after */}
            {allCategories.map((cat) => {
              const isActive = form.category.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                  onClick={() => setForm((curr) => ({ ...curr, category: cat }))}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field 4: Pill-Style Switch Toggle */}
        <div className={styles.field}>
          <div className={styles.toggleContainer}>
            <div 
              className={styles.slider}
              style={{
                transform: form.type === "debit" ? "translateX(0)" : "translateX(100%)"
              }}
            />
            <button
              type="button"
              className={`${styles.toggleButton} ${form.type === "debit" ? styles.debitActive : ""}`}
              onClick={() => setForm((curr) => ({ ...curr, type: "debit" }))}
            >
              Debit
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${form.type === "credit" ? styles.creditActive : ""}`}
              onClick={() => setForm((curr) => ({ ...curr, type: "credit" }))}
            >
              Credit
            </button>
          </div>
        </div>

        {/* Field 5: Unobtrusive Date selector link */}
        <div className={styles.dateLinkContainer}>
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
                  Add transaction
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}
