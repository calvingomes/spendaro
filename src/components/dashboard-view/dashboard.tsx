"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./dashboard.module.css";
import { SignOutButton } from "@/components/buttons/sign-out-button/sign-out-button";
import { AddExpenseButton } from "@/components/buttons/add-expense-button/add-expense-button";
import { ThemeToggle } from "@/components/theme-toggle/theme-toggle";
import { ExpenseWorkspace } from "@/components/expense-workspace/expense-workspace";
import { StatsCards } from "@/components/stats-cards/stats-cards";
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
          <Image src="/icons/icon-192x192.png" alt="Xpenses Logo" width={24} height={24} className={styles.brandLogo} unoptimized />
          <div>
            <p className={styles.brandName}>Xpenses</p>
          </div>
        </div>
        <div className={styles.topActions}>
          <AddExpenseButton />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <StatsCards expenses={expenses} />

      <ExpenseWorkspace initialExpenses={initialExpenses} onExpensesChange={setExpenses} />
    </main>
  );
}
