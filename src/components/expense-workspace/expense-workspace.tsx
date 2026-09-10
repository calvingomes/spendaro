"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import styles from "./expense-workspace.module.css";
import type { Expense } from "@/lib/types";
import { ExpenseList } from "@/components/expense-list/expense-list";
import { RecentActivityList } from "@/components/recent-activity-list/recent-activity-list";
import { useDashboard } from "@/context/dashboard-context";
import { getTopCategoryExpenses } from "@/utils/expense-utils";

const ExpenseAnalytics = dynamic(
  () => import("@/components/expense-analytics/expense-analytics").then((module) => module.ExpenseAnalytics),
  { ssr: false }
);

export function ExpenseWorkspace({ syncError }: { syncError: string | null }) {
  const { expenses, activeTab, setActiveTab, openExpenseModal } = useDashboard();

  const handleEdit = (expense: Expense) => {
    openExpenseModal({ editingExpense: expense });
  };

  const handleDuplicate = (expense: Expense) => {
    openExpenseModal({ prefillFrom: expense });
  };

  const topCategories = useMemo(
    () => getTopCategoryExpenses(expenses, { windowDays: 30, limit: 5 }),
    [expenses]
  );

  const isRankedMode = topCategories.length > 0;
  const homeExpenses = isRankedMode ? topCategories : expenses.slice(0, 10);
  const showSeeMore = isRankedMode ? expenses.length > 5 : expenses.length > 10;

  return (
    <section className={styles.workspace}>
      {syncError && (
        <p className={styles.syncError} role="status">
          {syncError}
        </p>
      )}

      {activeTab === "home" && expenses.length > 0 && (
        <div className={styles.recentActivity}>
          <h2 className={styles.sectionTitle}>
            {isRankedMode ? "Your top categories" : "Recent activity"}
          </h2>
          <RecentActivityList
            expenses={homeExpenses}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            isPending={false}
          />
          {showSeeMore && (
            <div className={styles.seeMoreContainer}>
              <button
                className={styles.seeMoreButton}
                type="button"
                onClick={() => setActiveTab("transactions")}
              >
                See all transactions
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "transactions" && (
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          isPending={false}
        />
      )}

      {activeTab === "analytics" && (
        <ExpenseAnalytics expenses={expenses} />
      )}
    </section>
  );
}
