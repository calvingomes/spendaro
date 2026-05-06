"use client";

import { useMemo, useState } from "react";
import styles from "./dashboard.module.css";
import { SignOutButton } from "../auth/sign-out-button";
import { AddExpenseButton } from "./add-expense-button";
import { ExpenseWorkspace } from "../expenses/expense-workspace";
import type { Expense } from "@/lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

export function Dashboard({
  initialExpenses
}: {
  initialExpenses: Expense[];
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const totalIncome = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        if (expense.type !== "credit") return total;
        const amount = Number.parseFloat(expense.amount);
        return total + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [expenses]
  );

  const totalExpense = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        if (expense.type !== "debit") return total;
        const amount = Number.parseFloat(expense.amount);
        return total + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [expenses]
  );

  const netBalance = totalIncome - totalExpense;

  const stats = [
    { label: "Overall Income", value: formatCurrency(totalIncome) },
    { label: "Overall Expense", value: formatCurrency(totalExpense) },
    { 
      label: "Net balance", 
      value: formatCurrency(netBalance),
      colorClass: netBalance >= 0 ? "positive" : "negative"
    }
  ];

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
        </div>
      </header>


      <section className={styles.statsGrid}>
        {stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <strong className={`${styles.statValue} ${stat.colorClass || ""}`}>{stat.value}</strong>
          </article>
        ))}
      </section>

      <ExpenseWorkspace initialExpenses={initialExpenses} onExpensesChange={setExpenses} />
    </main>
  );
}
