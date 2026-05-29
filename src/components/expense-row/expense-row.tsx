"use client";

import { ArrowUpRight, ArrowDownLeft, CircleFadingArrowUp, Pencil } from "lucide-react";
import styles from "./expense-row.module.css";
import { formatCurrency } from "@/utils/expense-utils";
import type { Expense } from "@/lib/types";

interface ExpenseRowProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  isPending: boolean;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
}

export function ExpenseRow({
  expense,
  onEdit,
  isPending,
  activeCardId,
  setActiveCardId
}: ExpenseRowProps) {
  const isActive = activeCardId === expense.id;

  return (
    <tr 
      className={`${styles.expenseRow} ${isActive ? styles.activeCard : ""}`}
      onClick={() => setActiveCardId(isActive ? null : expense.id)}
    >
      <td className={styles.labelCell}>{expense.label}</td>
      <td className={`${styles.amountCell} ${
        expense.type === "credit" 
          ? styles.positive 
          : expense.type === "savings" 
            ? styles.savings 
            : styles.negative
      }`}>
        <div className={styles.amountContent}>
          {expense.type === "credit" ? (
            <ArrowUpRight className={styles.amountIcon} />
          ) : expense.type === "savings" ? (
            <CircleFadingArrowUp className={styles.amountIcon} />
          ) : (
            <ArrowDownLeft className={styles.amountIcon} />
          )}
          {formatCurrency(expense.amount)}
        </div>
      </td>
      <td className={styles.categoryCell}>{expense.category}</td>
      <td className={styles.dateCell}>
        {new Date(expense.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
      </td>
      <td className={styles.actionsCellWrap}>
        <div className={styles.actionsCell}>
          <button 
            className={styles.tableButton} 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(expense);
            }} 
            disabled={isPending} 
            title="Edit"
          >
            <Pencil className={styles.tableIcon} />
            <span>Edit</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
