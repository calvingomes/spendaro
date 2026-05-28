"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronDown } from "lucide-react";
import styles from "./expense-analytics.module.css";
import type { Expense } from "@/lib/types";
import { getWeekRange, getWeekLabel } from "@/utils/date-utils";

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

type TimeSegment = "week" | "month" | "quarter";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

import { AnimatedCounter } from "@/components/ui/animated-counter/animated-counter";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const WEEKS = [0, 1, 2, 3, 4, 5];

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
  const WEEKS_LIST = useMemo(() => {
    if (expenses.length === 0) return WEEKS;
    
    let oldestDate = new Date();
    expenses.forEach((e) => {
      const expDate = new Date(e.created_at);
      if (expDate < oldestDate) oldestDate = expDate;
    });
    
    const today = new Date();
    const msDiff = today.getTime() - oldestDate.getTime();
    const weeksDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24 * 7));
    
    const count = Math.max(6, weeksDiff);
    return Array.from({ length: count }, (_, idx) => idx);
  }, [expenses]);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Center scroll whenever segment switches
  useEffect(() => {
    if (carouselRef.current) {
      const activeEl = carouselRef.current.querySelector(`.${styles.activePeriod}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [timeSegment, selectedMonthIdx, selectedQuarterIdx, selectedWeekIdx]);

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
    <article className={`${styles.card} surface radius-3`}>
      {/* Top Header Row */}
      <div className={styles.header}>
        <div className={styles.selectWrapper}>
          <select
            className={styles.typeSelect}
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as "debit" | "credit")}
          >
            <option value="debit">Expenses</option>
            <option value="credit">Income</option>
          </select>
          <ChevronDown className={styles.selectArrow} size={16} />
        </div>

        {/* Capsule Time Segment Selector */}
        <div className={styles.segmentedControl}>
          {(["week", "month", "quarter"] as const).map((segment) => (
            <button
              key={segment}
              type="button"
              className={`${styles.segmentButton} ${timeSegment === segment ? styles.activeSegment : ""}`}
              onClick={() => setTimeSegment(segment)}
            >
              {segment.charAt(0).toUpperCase() + segment.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Date Carousel row (centered & scrollable) */}
      <div className={styles.carouselContainer}>
        <div className={styles.carousel} ref={carouselRef}>
          {timeSegment === "month" &&
            MONTHS.map((month, idx) => {
              const isActive = selectedMonthIdx === idx;
              return (
                <button
                  key={month}
                  type="button"
                  className={`${styles.periodButton} ${isActive ? styles.activePeriod : ""}`}
                  onClick={() => setSelectedMonthIdx(idx)}
                >
                  {month}
                </button>
              );
            })}

          {timeSegment === "quarter" &&
            QUARTERS.map((q, idx) => {
              const isActive = selectedQuarterIdx === idx;
              return (
                <button
                  key={q}
                  type="button"
                  className={`${styles.periodButton} ${isActive ? styles.activePeriod : ""}`}
                  onClick={() => setSelectedQuarterIdx(idx)}
                >
                  {q}
                </button>
              );
            })}

          {timeSegment === "week" &&
            WEEKS_LIST.map((weeksAgo) => {
              const isActive = selectedWeekIdx === weeksAgo;
              return (
                <button
                  key={weeksAgo}
                  type="button"
                  className={`${styles.periodButton} ${isActive ? styles.activePeriod : ""}`}
                  onClick={() => setSelectedWeekIdx(weeksAgo)}
                >
                  {getWeekLabel(weeksAgo)}
                </button>
              );
            })}
        </div>
      </div>

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
                  ₹{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
