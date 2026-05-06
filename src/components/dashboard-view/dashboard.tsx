"use client";

import { useState } from "react";
import styles from "./dashboard.module.css";
import { SignOutButton } from "../buttons/sign-out-button/sign-out-button";
import { AddExpenseButton } from "../buttons/add-expense-button/add-expense-button";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { ExpenseWorkspace } from "../expense-workspace/expense-workspace";
import { StatsCards } from "../stats-cards/stats-cards";
import type { Expense } from "@/lib/types";

export function Dashboard({
  initialExpenses
}: {
  initialExpenses: Expense[];
}) {
  const [expenses, setExpenses] = useState(initialExpenses);

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <img src="/icons/icon-192x192.png" alt="Spendaro Logo" className={styles.brandLogo} />
          <div>
            <p className={styles.brandName}>Spendaro</p>
          </div>
        </div>
        <div className={styles.topActions}>
          <AddExpenseButton />
          <SignOutButton />
          <ThemeToggle />
        </div>
      </header>

      <StatsCards expenses={expenses} />

      <ExpenseWorkspace initialExpenses={initialExpenses} onExpensesChange={setExpenses} />
    </main>
  );
}
