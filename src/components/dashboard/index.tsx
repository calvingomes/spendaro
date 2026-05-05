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
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthIncome = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        const createdAt = new Date(expense.created_at);
        if (createdAt.getMonth() !== currentMonth || createdAt.getFullYear() !== currentYear || expense.type !== "credit") {
          return total;
        }

        const amount = Number.parseFloat(expense.amount);
        return total + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [expenses, currentMonth, currentYear]
  );

  const thisMonthExpense = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        const createdAt = new Date(expense.created_at);
        if (createdAt.getMonth() !== currentMonth || createdAt.getFullYear() !== currentYear || expense.type !== "debit") {
          return total;
        }

        const amount = Number.parseFloat(expense.amount);
        return total + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [expenses, currentMonth, currentYear]
  );

  const thisMonthBalance = thisMonthIncome - thisMonthExpense;

  const stats = [
    { label: "Income this month", value: formatCurrency(thisMonthIncome) },
    { label: "Expense this month", value: formatCurrency(thisMonthExpense) },
    { label: "Net balance", value: formatCurrency(thisMonthBalance) }
  ];

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
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
            <strong className={styles.statValue}>{stat.value}</strong>
          </article>
        ))}
      </section>

      <ExpenseWorkspace initialExpenses={initialExpenses} onExpensesChange={setExpenses} />
    </main>
  );
}
