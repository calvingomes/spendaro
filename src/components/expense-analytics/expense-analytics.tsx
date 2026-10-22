"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./expense-analytics.module.css";
import type { Expense } from "@/lib/types";
import { getWeekRange } from "@/utils/date-utils";
import { AnimatedCounter } from "@/components/ui/animated-counter/animated-counter";
import { formatCurrency } from "@/utils/expense-utils";
import { SPLIT_CATEGORY_TAG } from "@/utils/expense-utils";
import type { TimeSegment } from "@/components/expense-filters/expense-filters";

// Curated Harmony Palette (low-contrast, Sleek HSL colors for dark mode)
const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#ef4444", // Red
  "#6366f1", // Indigo
  "#a855f7", // Violet
];

export function ExpenseAnalytics({ expenses, timeSegment, selectedWeekIdx, selectedMonthIdx, selectedQuarterIdx }: { expenses: Expense[]; timeSegment: TimeSegment; selectedWeekIdx: number; selectedMonthIdx: number; selectedQuarterIdx: number }) {


  // Memoized filtered data calculations
  const categoryData = useMemo(() => {
    const map = new Map<string, { debits: number; credits: number }>();
    const currentYear = new Date().getFullYear();

    expenses
      .filter((e) => (e.type === "debit" || e.type === "credit") && e.category !== SPLIT_CATEGORY_TAG)
      .filter((e) => {
        const expenseDate = new Date(e.created_at);
        const expYear = expenseDate.getFullYear();

        if (timeSegment === "month") {
          return expenseDate.getMonth() === selectedMonthIdx && expYear === currentYear;
        } else if (timeSegment === "quarter") {
          const expQuarter = Math.floor(expenseDate.getMonth() / 3);
          return expQuarter === selectedQuarterIdx && expYear === currentYear;
        } else if (timeSegment === "week") {
          const { start, end } = getWeekRange(selectedWeekIdx);
          return expenseDate >= start && expenseDate <= end;
        } else if (timeSegment === "all") {
          return true;
        }
        return false;
      })
      .forEach((e) => {
        const val = e.amount;
        if (val !== undefined && val !== null) {
          // Normalize categories
          const cat = e.category || "Other";
          const current = map.get(cat) ?? { debits: 0, credits: 0 };

          if (e.type === "debit") current.debits += val;
          if (e.type === "credit") current.credits += val;

          map.set(cat, current);
        }
      });

    return [...map.entries()]
      .map(([name, amounts]) => ({
        name,
        // Net is spending after same-category refunds, never a cash balance.
        value: Math.max(0, amounts.debits - amounts.credits),
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses, timeSegment, selectedMonthIdx, selectedQuarterIdx, selectedWeekIdx]);

  // Aggregate Total Sum
  const totalAmount = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryData]);

  // Pie charts need non-negative values. Keep displayed net amounts signed,
  // but use their magnitude for slice sizes when income exceeds expenses.
  const chartData = useMemo(
    () => categoryData.map((item) => ({ ...item, chartValue: Math.abs(item.value) })),
    [categoryData]
  );

  return (
    <article className={styles.card}>
      {categoryData.length > 0 ? (
        <>
          {/* Pie Chart Box */}
          <div className={styles.chartWrapper}>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={90}
                    cornerRadius={8}
                    paddingAngle={5}
                    dataKey="chartValue"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-bg-surface-raised)",
                      border: "1px solid var(--color-border-strong)",
                      borderRadius: "var(--radius-2)",
                      color: "var(--color-text)",
                    }}
                    itemStyle={{ color: "var(--color-text)", fontSize: "var(--text-xs)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Abs Center Label Overlay */}
              <div className={styles.centerLabel}>
                <span className={styles.totalValue}>
                  <AnimatedCounter value={totalAmount} />
                </span>
                {(totalAmount >= 1000 || totalAmount % 1 !== 0) && (
                  <span className={styles.exactValue}>
                    {formatCurrency(totalAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.legendGrid}>
            {categoryData.map((item, index) => (
              <div key={item.name} className={styles.legendItem}>
                <div className={styles.legendInfo}>
                  <span
                    className={styles.dot}
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className={styles.categoryName}>{item.name}</span>
                </div>
                <span className={styles.categoryAmount}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No data available for this range</p>
        </div>
      )}
    </article>
  );
}
