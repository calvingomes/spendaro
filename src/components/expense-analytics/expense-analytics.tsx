"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import styles from "./expense-analytics.module.css";
import type { Expense } from "@/lib/types";

const COLORS = [
  "var(--color-blue)",
  "var(--color-teal)",
  "var(--color-purple)",
  "var(--color-amber)",
  "var(--color-pink)",
  "var(--color-green)",
  "var(--color-red)"
];

export function ExpenseAnalytics({ expenses }: { expenses: Expense[] }) {
  // Data for Category Pie Chart (Expenses only)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses
      .filter((e) => e.type === "debit")
      .forEach((e) => {
        map.set(e.category, (map.get(e.category) ?? 0) + Number.parseFloat(e.amount));
      });

    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  if (expenses.length === 0) return null;

  return (
    <section className={styles.analytics}>
      <div className={styles.grid}>
        {/* Category Breakdown */}
        <article className={styles.card}>
          <div className={styles.header}>
            <p className={styles.kicker}>Breakdown</p>
            <h3 className={styles.title}>Spending by category</h3>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
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
                    borderRadius: "8px",
                    color: "var(--color-text)",
                  }}
                  itemStyle={{ color: "var(--color-text)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.legend}>
            {categoryData.slice(0, 4).map((item, index) => (
              <div key={item.name} className={styles.legendItem}>
                <span
                  className={styles.dot}
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className={styles.legendName}>{item.name}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
