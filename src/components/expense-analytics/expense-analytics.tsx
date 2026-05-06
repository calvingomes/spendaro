"use client";

import styles from "./expense-analytics.module.css";
import type { Expense } from "@/lib/types";
import { CategoryBreakdown } from "./category-breakdown/category-breakdown";

export function ExpenseAnalytics({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) return null;

  return (
    <section className={styles.analytics}>
      <div className={styles.grid}>
        <CategoryBreakdown expenses={expenses} />
      </div>
    </section>
  );
}
