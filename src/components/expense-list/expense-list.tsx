"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, CircleFadingArrowUp, Pencil, Search, ChevronDown } from "lucide-react";
import styles from "./expense-list.module.css";
import { ExpenseRow } from "../expense-row/expense-row";
import { calculateAggregates, formatCurrency, formatDateForInput } from "@/utils/expense-utils";
import { isDateInRange, type DateRange } from "@/utils/date-utils";
import type { Expense } from "@/lib/types";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  isPending: boolean;
}

export function ExpenseList({ expenses, onEdit, isPending }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [range, setRange] = useState<DateRange>("this-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const today = useMemo(() => formatDateForInput(new Date()), []);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => isDateInRange(new Date(e.created_at), range, customStart, customEnd))
      .filter((e) => 
        e.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (diff !== 0) return diff;
        return b.id.localeCompare(a.id);
      });
  }, [expenses, searchTerm, range, customStart, customEnd]);

  const { income, expense, savings } = useMemo(() => 
    calculateAggregates(filteredExpenses), 
    [filteredExpenses]
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setVisibleCount((prev) => Math.min(prev + 50, filteredExpenses.length));
    }
  };

  const displayedExpenses = filteredExpenses.slice(0, visibleCount);

  return (
    <article className={styles.listCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerMain}>
          <div className={styles.titleGroup}>
            <p className={styles.sectionKicker}>Activity</p>
            <h2 className={styles.sectionTitle}>Recent transactions</h2>
          </div>

          <div className={styles.headerStats}>
            <div className={styles.headerStatItem}>
              <span className={styles.statLabel}>Income</span>
              <span className={`${styles.statValue} ${styles.positive}`}>{formatCurrency(income)}</span>
            </div>
            <div className={styles.headerStatItem}>
              <span className={styles.statLabel}>Expense</span>
              <span className={`${styles.statValue} ${styles.negative}`}>{formatCurrency(expense)}</span>
            </div>
            <div className={styles.headerStatItem}>
              <span className={styles.statLabel}>Savings</span>
              <span className={`${styles.statValue} ${styles.savings}`}>{formatCurrency(savings)}</span>
            </div>
          </div>

          <div className={styles.selectWrapper}>
            <select 
              className={styles.rangeSelect}
              value={range}
              onChange={(e) => setRange(e.target.value as DateRange)}
            >
              <option value="overall">Overall</option>
              <option value="this-month">This month</option>
              <option value="last-month">Last month</option>
              <option value="last-3-months">Last 3 months</option>
              <option value="custom">Custom range</option>
            </select>
            <ChevronDown className={styles.selectArrow} />
          </div>
        </div>
        
        <div className={styles.sectionActions}>
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
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search Label or Category..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className={styles.tableWrap} onScroll={handleScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Label</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedExpenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onEdit={onEdit}
                  isPending={isPending}
                  activeCardId={activeCardId}
                  setActiveCardId={setActiveCardId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
