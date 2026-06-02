"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import styles from "./expense-list.module.css";
import { ExpenseRow } from "../expense-row/expense-row";
import { getWeekRange, getWeeksList } from "@/utils/date-utils";
import { calculateAggregates, formatCurrency } from "@/utils/expense-utils";
import type { Expense } from "@/lib/types";
import { ExpenseFilters, type TimeSegment } from "@/components/expense-filters/expense-filters";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  isPending: boolean;
}

export function ExpenseList({ expenses, onEdit, isPending }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeSegment, setTimeSegment] = useState<TimeSegment>("month");
  const [activeType, setActiveType] = useState<"debit" | "credit" | "all">("all");

  // Dynamic current date states
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentQuarterIdx = Math.floor(currentMonthIdx / 3);

  const [selectedMonthIdx, setSelectedMonthIdx] = useState(currentMonthIdx);
  const [selectedQuarterIdx, setSelectedQuarterIdx] = useState(currentQuarterIdx);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(50);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Dynamically calculate weeks based on oldest expense (fallback to at least 6 weeks)
  const WEEKS_LIST = useMemo(() => getWeeksList(expenses), [expenses]);

  // Memoized filtered data calculations
  const filteredExpenses = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return expenses
      .filter((e) => {
        // Filter by Transaction Type (debit / credit / all)
        if (activeType === "all") return true;
        return e.type === activeType;
      })
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
        return true;
      })
      .filter((e) => 
        e.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (diff !== 0) return diff;
        return b.id.localeCompare(a.id);
      });
  }, [expenses, searchTerm, timeSegment, selectedMonthIdx, selectedQuarterIdx, selectedWeekIdx, activeType]);

  const { income, expense } = useMemo(() => 
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
        <ExpenseFilters
          activeType={activeType}
          onTypeChange={setActiveType}
          typeOptions={[
            { value: "all", label: "All Transactions" },
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

        {/* Row 3: Search box (left) + Aggregates (right) */}
        <div className={styles.filterActionsRow}>
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

          <div className={styles.headerStats}>
            <div className={styles.headerStatItem}>
              <span className={styles.statLabel}>Income</span>
              <span className={`${styles.statValue} ${styles.positive}`}>{formatCurrency(income)}</span>
            </div>
            <div className={styles.headerStatItem}>
              <span className={styles.statLabel}>Expense</span>
              <span className={`${styles.statValue} ${styles.negative}`}>{formatCurrency(expense)}</span>
            </div>
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
