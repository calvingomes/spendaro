"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./expense-filters.module.css";
import { getWeekLabel } from "@/utils/date-utils";

export type TimeSegment = "week" | "month" | "quarter" | "all";

export interface TypeOption<T extends string> {
  value: T;
  label: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const QUARTERS = ["Jan - Mar", "Apr - Jun", "Jul - Sep", "Oct - Dec"];

interface ExpenseFiltersProps<T extends string> {
  activeType: T;
  onTypeChange: (type: T) => void;
  typeOptions: TypeOption<T>[];
  timeSegment: TimeSegment;
  onTimeSegmentChange: (segment: TimeSegment) => void;
  selectedWeekIdx: number;
  onWeekChange: (idx: number) => void;
  selectedMonthIdx: number;
  onMonthChange: (idx: number) => void;
  selectedQuarterIdx: number;
  onQuarterChange: (idx: number) => void;
  weeksList: number[];
}

export function ExpenseFilters<T extends string>({
  activeType,
  onTypeChange,
  typeOptions,
  timeSegment,
  onTimeSegmentChange,
  selectedWeekIdx,
  onWeekChange,
  selectedMonthIdx,
  onMonthChange,
  selectedQuarterIdx,
  onQuarterChange,
  weeksList,
}: ExpenseFiltersProps<T>) {
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

  return (
    <div className={styles.filterSection}>
      {/* Top Header Row */}
      <div className={styles.header}>
        <div className={styles.selectWrapper}>
          <select
            className={styles.typeSelect}
            value={activeType}
            onChange={(e) => onTypeChange(e.target.value as T)}
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className={styles.selectArrow} size={16} />
        </div>

        {/* Capsule Time Segment Selector */}
        <div className={styles.segmentedControl}>
          {(["week", "month", "quarter", "all"] as const).map((segment) => (
            <button
              key={segment}
              type="button"
              className={`${styles.segmentButton} ${timeSegment === segment ? styles.activeSegment : ""}`}
              onClick={() => onTimeSegmentChange(segment)}
            >
              {segment.charAt(0).toUpperCase() + segment.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Date Carousel row (centered & scrollable) */}
      {timeSegment !== "all" && (
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
                    onClick={() => onMonthChange(idx)}
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
                    onClick={() => onQuarterChange(idx)}
                  >
                    {q}
                  </button>
                );
              })}

            {timeSegment === "week" &&
              weeksList.map((weeksAgo) => {
                const isActive = selectedWeekIdx === weeksAgo;
                return (
                  <button
                    key={weeksAgo}
                    type="button"
                    className={`${styles.periodButton} ${isActive ? styles.activePeriod : ""}`}
                    onClick={() => onWeekChange(weeksAgo)}
                  >
                    {getWeekLabel(weeksAgo)}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
