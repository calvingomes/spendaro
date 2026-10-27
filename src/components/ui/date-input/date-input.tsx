"use client";

import styles from "./date-input.module.css";
import { formatDateDisplay } from "@/utils/date-utils";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateInput({ value, onChange }: DateInputProps) {
  return (
    <div className={styles.container}>
      <span className={styles.dateValue}>{formatDateDisplay(value)}</span>
      <span className={styles.changeAction}> · change</span>
      <input
        type="date"
        className={styles.hiddenInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
