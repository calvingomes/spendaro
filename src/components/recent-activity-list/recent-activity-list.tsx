"use client";

import { useState } from "react";
import styles from "./recent-activity-list.module.css";
import { ExpenseRow } from "../expense-row/expense-row";
import type { Expense } from "@/lib/types";

interface RecentActivityListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  isPending: boolean;
  justAddedId?: string | null;
}

export function RecentActivityList({ expenses, onEdit, isPending, justAddedId }: RecentActivityListProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  return (
    <article className={styles.simpleList}>
      {expenses.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className={styles.simpleTableWrap}>
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
              {expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onEdit={onEdit}
                  isPending={isPending}
                  activeCardId={activeCardId}
                  setActiveCardId={setActiveCardId}
                  justAdded={expense.id === justAddedId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
