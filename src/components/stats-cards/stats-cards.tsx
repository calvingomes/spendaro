/* eslint-disable css-modules/no-unused-class */
"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import styles from "./stats-cards.module.css";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/utils/expense-utils";

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

  const totalSavings = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        if (expense.type !== "savings") return total;
        const amount = Number.parseFloat(expense.amount);
        return total + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [expenses]
  );

  const netBalance = totalIncome - totalExpense - totalSavings;

  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroHeader}>
        <div className={styles.balanceBlock}>
          <span className={styles.balanceLabel}>Balance</span>
          <h1 className={styles.balanceValue}>
            {formatCurrency(netBalance)}
          </h1>
        </div>

        <div className={`${styles.actionButtonsRow} ${styles.desktopOnly}`}>
          <button
            className={styles.primaryActionButton}
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense", { detail: { defaultType: "debit" } }))}
          >
            <TrendingDown size={14} />
            Add expense
          </button>
          <button
            className={styles.primaryActionButton}
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense", { detail: { defaultType: "credit" } }))}
          >
            <TrendingUp size={14} />
            Add income
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <article className={styles.statCard}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconPill} ${styles.incomeIcon}`}>
              <TrendingUp size={14} />
            </div>
            <span className={styles.cardLabel}>Income</span>
          </div>
          <strong className={styles.cardValue}>{formatCurrency(totalIncome)}</strong>
        </article>

        <article className={styles.statCard}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconPill} ${styles.expenseIcon}`}>
              <TrendingDown size={14} />
            </div>
            <span className={styles.cardLabel}>Expense</span>
          </div>
          <strong className={styles.cardValue}>{formatCurrency(totalExpense)}</strong>
        </article>

        <article className={styles.statCard}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconPill} ${styles.savingsIcon}`}>
              <PiggyBank size={14} />
            </div>
            <span className={styles.cardLabel}>Savings</span>
          </div>
          <strong className={styles.cardValue}>{formatCurrency(totalSavings)}</strong>
        </article>
      </div>

      <div className={`${styles.actionButtonsRow} ${styles.mobileOnly}`}>
        <button
          className={styles.primaryActionButton}
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense", { detail: { defaultType: "debit" } }))}
        >
          <TrendingDown size={16} />
          Add expense
        </button>
        <button
          className={styles.primaryActionButton}
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense", { detail: { defaultType: "credit" } }))}
        >
          <TrendingUp size={16} />
          Add income
        </button>
      </div>
    </div>
  );
}
