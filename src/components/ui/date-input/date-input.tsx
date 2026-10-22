"use client";

import { useRef } from "react";
import styles from "./date-input.module.css";
import { formatDateDisplay } from "@/utils/date-utils";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateInput({ value, onChange }: DateInputProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={styles.container}
      onClick={() => dateInputRef.current?.showPicker()}
    >
      <span className={styles.dateValue}>{formatDateDisplay(value)}</span>
      <span className={styles.changeAction}> · change</span>
      <input
        ref={dateInputRef}
        type="date"
        className={styles.hiddenInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
