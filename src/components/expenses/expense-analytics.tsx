"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
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
  // 1. Data for Category Pie Chart (Expenses only)
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

  // 2. Data for Daily Trend (Current Month)
  const trendData = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const map = new Map<number, number>();

    // Initialize all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      map.set(i, 0);
    }

    expenses
      .filter((e) => {
        const date = new Date(e.created_at);
        return (
          e.type === "debit" &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .forEach((e) => {
        const day = new Date(e.created_at).getDate();
        map.set(day, (map.get(day) ?? 0) + Number.parseFloat(e.amount));
      });

    return [...map.entries()].map(([day, amount]) => ({
      day: day.toString(),
      amount,
    }));
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
            <ResponsiveContainer width="100%" height="100%">
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

        {/* Daily Trend */}
        <article className={styles.card}>
          <div className={styles.header}>
            <p className={styles.kicker}>Insights</p>
            <h3 className={styles.title}>Monthly spending trend</h3>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-text)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--color-text)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                />
                <YAxis
                  hide
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg-surface-raised)",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: "8px",
                    color: "var(--color-text)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-text)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}
