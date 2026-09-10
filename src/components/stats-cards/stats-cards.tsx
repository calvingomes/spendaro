"use client";

import { useMemo } from "react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import styles from "./stats-cards.module.css";
import { formatCurrency } from "@/utils/expense-utils";
import { useDashboard } from "@/context/dashboard-context";

export function StatsCards() {
  const { expenses, justAddedId } = useDashboard();

  const totalIncome = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        if (expense.type !== "credit") return total;
        return total + (expense.amount || 0);
      }, 0),
    [expenses]
  );

  const totalExpense = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        if (expense.type === "debit") {
          return total + (expense.amount || 0);
        }
        return total;
      }, 0),
    [expenses]
  );

  const totalSavings = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        if (expense.type !== "savings") return total;
        return total + (expense.amount || 0);
      }, 0),
    [expenses]
  );

  const netBalance = totalIncome - totalExpense - totalSavings;

  const justAdded = justAddedId ? expenses.find((e) => e.id === justAddedId) : null;

  return (
    <div className={styles.heroContainer}>
      <div className={styles.balanceBlock}>
        <span className={styles.balanceLabel}>Balance</span>
        <h1 className={styles.balanceValue}>
          {formatCurrency(netBalance)}
        </h1>
        <p
          key={justAdded?.id ?? "empty"}
          className={styles.lastAdded}
          style={{
            color: justAdded
              ? justAdded.type === "credit" ? "var(--color-green)" : "var(--color-red)"
              : "transparent",
            animation: justAdded ? undefined : "none",
            pointerEvents: "none",
          }}
        >
          {justAdded
            ? `${justAdded.type === "credit" ? "+" : "-"}${formatCurrency(justAdded.amount)} · ${justAdded.label}`
            : "\u00A0"}
        </p>
      </div>

      <div className={styles.statsRow}>
        <article className={styles.statCard}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconPill} ${styles.incomeIcon}`}>
              <ArrowUpRight size={14} />
            </div>
            <span className={styles.cardLabel}>Income</span>
          </div>
          <strong className={styles.cardValue}>{formatCurrency(totalIncome)}</strong>
        </article>

        <article className={styles.statCard}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconPill} ${styles.expenseIcon}`}>
              <ArrowDownLeft size={14} />
            </div>
            <span className={styles.cardLabel}>Expense</span>
          </div>
          <strong className={styles.cardValue}>{formatCurrency(totalExpense)}</strong>
        </article>
      </div>
    </div>
  );
}
