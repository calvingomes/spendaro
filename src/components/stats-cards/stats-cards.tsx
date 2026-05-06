"use client";

import { useMemo } from "react";
import styles from "./stats-cards.module.css";
import type { Expense } from "@/lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

export function StatsCards({ expenses }: { expenses: Expense[] }) {
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
    <section className={styles.statsGrid}>
      {stats.map((stat) => (
        <article key={stat.label} className={styles.statCard}>
          <p className={styles.statLabel}>{stat.label}</p>
          <strong className={`${styles.statValue} ${stat.colorClass || ""}`}>{stat.value}</strong>
        </article>
      ))}
    </section>
  );
}
