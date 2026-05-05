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

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  const thisMonthBalance = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        const createdAt = new Date(expense.created_at);
        if (createdAt.getMonth() !== currentMonth || createdAt.getFullYear() !== currentYear) {
          return total;
        }

        const amount = Number.parseFloat(expense.amount);
        if (Number.isNaN(amount)) return total;
        return total + (expense.type === "credit" ? amount : -amount);
      }, 0),
    [expenses, currentMonth, currentYear]
  );

  const totalBalance = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        const amount = Number.parseFloat(expense.amount);
        if (Number.isNaN(amount)) return total;
        return total + (expense.type === "credit" ? amount : -amount);
      }, 0),
    [expenses]
  );

  const monthlyExpenseCount = useMemo(
    () =>
      expenses.filter((expense) => {
        const createdAt = new Date(expense.created_at);
        return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
      }).length,
    [expenses, currentMonth, currentYear]
  );

  const averageBalance = monthlyExpenseCount > 0 ? thisMonthBalance / monthlyExpenseCount : 0;

  const topCategory = useMemo(() => {
    const categoryCount = new Map<string, number>();
    for (const expense of expenses) {
      categoryCount.set(expense.category, (categoryCount.get(expense.category) ?? 0) + 1);
    }

    const category = [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return category ? toTitleCase(category) : "None yet";
  }, [expenses]);

  const stats = [
    { label: "Net this month", value: formatCurrency(thisMonthBalance) },
    { label: "Avg this month", value: formatCurrency(averageBalance) },
    { label: "Top category", value: topCategory }
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

      <section className={styles.hero}>
        <div>
          <h1 className={styles.title}>Expenses</h1>
        </div>
      </section>

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
