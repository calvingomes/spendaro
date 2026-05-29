"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./expense-analytics.module.css";
import type { Expense } from "@/lib/types";
import { getWeekRange, getWeeksList } from "@/utils/date-utils";
import { AnimatedCounter } from "@/components/ui/animated-counter/animated-counter";
import { formatCurrency } from "@/utils/expense-utils";
import { ExpenseFilters, type TimeSegment } from "@/components/expense-filters/expense-filters";

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

export function ExpenseAnalytics({ expenses }: { expenses: Expense[] }) {
  const [activeType, setActiveType] = useState<"debit" | "credit">("debit");
  const [timeSegment, setTimeSegment] = useState<TimeSegment>("month");

  // Dynamic current date states
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentQuarterIdx = Math.floor(currentMonthIdx / 3);

  const [selectedMonthIdx, setSelectedMonthIdx] = useState(currentMonthIdx);
  const [selectedQuarterIdx, setSelectedQuarterIdx] = useState(currentQuarterIdx);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  // Dynamically calculate weeks based on oldest expense (fallback to at least 6 weeks)
  const WEEKS_LIST = useMemo(() => getWeeksList(expenses), [expenses]);

  // Memoized filtered data calculations
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    const currentYear = new Date().getFullYear();

    expenses
      .filter((e) => e.type === activeType)
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
        const val = Number.parseFloat(e.amount);
        if (!Number.isNaN(val)) {
          // Normalize categories
          const cat = e.category || "Other";
          map.set(cat, (map.get(cat) ?? 0) + val);
        }
      });

    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, activeType, timeSegment, selectedMonthIdx, selectedQuarterIdx, selectedWeekIdx]);

  // Aggregate Total Sum
  const totalAmount = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryData]);

  return (
    <article className={styles.card}>
      <ExpenseFilters
        activeType={activeType}
        onTypeChange={setActiveType}
        typeOptions={[
          { value: "debit", label: "Expenses" },
          { value: "credit", label: "Income" },
        ]}
        timeSegment={timeSegment}
        onTimeSegmentChange={setTimeSegment}
        selectedWeekIdx={selectedWeekIdx}
        onWeekChange={setSelectedWeekIdx}
        selectedMonthIdx={selectedMonthIdx}
        onMonthChange={setSelectedMonthIdx}
        selectedQuarterIdx={selectedQuarterIdx}
        onQuarterChange={setSelectedQuarterIdx}
        weeksList={WEEKS_LIST}
      />

      {categoryData.length > 0 ? (
        <>
          {/* Pie Chart Box */}
          <div className={styles.chartWrapper}>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={90}
                    cornerRadius={8}
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
