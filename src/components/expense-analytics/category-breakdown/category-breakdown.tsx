"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChevronDown } from "lucide-react";
import styles from "./category-breakdown.module.css";
import type { Expense } from "@/lib/types";
import { isDateInRange, type DateRange } from "@/utils/date-utils";
import { formatDateForInput } from "@/utils/expense-utils";

const COLORS = [
  "var(--color-blue)",
  "var(--color-teal)",
  "var(--color-purple)",
  "var(--color-amber)",
  "var(--color-pink)",
  "var(--color-green)",
  "var(--color-red)"
];

interface CategoryBreakdownProps {
  expenses: Expense[];
}

export function CategoryBreakdown({ expenses }: CategoryBreakdownProps) {
  const [range, setRange] = useState<DateRange>("this-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const today = useMemo(() => formatDateForInput(new Date()), []);

  // Data for Category Pie Chart
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    
    expenses
      .filter((e) => e.type === "debit")
      .filter((e) => isDateInRange(new Date(e.created_at), range, customStart, customEnd))
      .forEach((e) => {
        map.set(e.category, (map.get(e.category) ?? 0) + Number.parseFloat(e.amount));
      });

    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, range, customStart, customEnd]);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.titleGroup}>
            <p className={styles.kicker}>Breakdown</p>
            <h3 className={styles.title}>Spending by category</h3>
          </div>
          
          <div className={styles.selectWrapper}>
            <select 
              className={styles.rangeSelect}
              value={range}
              onChange={(e) => setRange(e.target.value as DateRange)}
            >
              <option value="this-month">This month</option>
              <option value="last-month">Last month</option>
              <option value="last-3-months">Last 3 months</option>
              <option value="overall">Overall</option>
              <option value="custom">Custom range</option>
            </select>
            <ChevronDown className={styles.selectArrow} />
          </div>
        </div>

        {range === "custom" && (
          <div className={styles.customDates}>
            <input 
              type="date" 
              value={customStart} 
              onChange={(e) => setCustomStart(e.target.value)}
              max={today}
              className={styles.dateInput}
            />
            <span className={styles.dateSeparator}>to</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart}
              max={today}
              className={styles.dateInput}
            />
          </div>
        )}
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
      
      {categoryData.length > 0 ? (
        <div className={styles.legend}>
          {categoryData.slice(0, 6).map((item, index) => (
            <div key={item.name} className={styles.legendItem}>
              <span
                className={styles.dot}
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className={styles.legendName}>{item.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          No spending data for this period
        </div>
      )}
    </article>
  );
}
