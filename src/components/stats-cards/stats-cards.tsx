"use client";

import { useMemo } from "react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import styles from "./stats-cards.module.css";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/utils/expense-utils";
import { Button } from "@/components/ui/button/button";

export function StatsCards({ 
  expenses
}: { 
  expenses: Expense[];
}) {
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
        if (expense.type === "debit") {
          const amount = Number.parseFloat(expense.amount);
          return total + (Number.isNaN(amount) ? 0 : amount);
        }
        return total;
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

        <div className={`${styles.desktopActionContainer} ${styles.desktopOnly}`}>
          <div className={styles.actionButtonsRow}>
            <Button
              variant="primary"
              size="md"
              className={styles.primaryActionButton}
              onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense", { detail: { defaultType: "debit" } }))}
              icon={<ArrowDownLeft size={14} />}
            >
              Debit
            </Button>
            <Button
              variant="primary"
              size="md"
              className={styles.primaryActionButton}
              onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense", { detail: { defaultType: "credit" } }))}
              icon={<ArrowUpRight size={14} />}
            >
              Credit
            </Button>
          </div>
        </div>
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

      <div className={`${styles.mobileActionContainer} ${styles.mobileOnly}`}>
        <div className={styles.actionButtonsRow}>
          <Button
            variant="primary"
            size="md"
            className={styles.primaryActionButton}
            onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense", { detail: { defaultType: "debit" } }))}
            icon={<ArrowDownLeft size={16} />}
          >
            Debit
          </Button>
          <Button
            variant="primary"
            size="md"
            className={styles.primaryActionButton}
            onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense", { detail: { defaultType: "credit" } }))}
            icon={<ArrowUpRight size={16} />}
          >
            Credit
          </Button>
        </div>
      </div>
    </div>
  );
}
