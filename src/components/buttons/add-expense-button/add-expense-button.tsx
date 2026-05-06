"use client";

import { Plus } from "lucide-react";
import styles from "./add-expense-button.module.css";

export function AddExpenseButton() {
  return (
    <button
      className={styles.addButton}
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("spendaro:add-expense"))}
    >
      <Plus className={styles.addIcon} />
      Add expense
    </button>
  );
}
