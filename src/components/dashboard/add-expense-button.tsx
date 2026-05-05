"use client";

import styles from "./dashboard.module.css";

export function AddExpenseButton() {
  return (
    <button
      className={styles.addButton}
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("spendaro:add-expense"))}
    >
      Add expense
    </button>
  );
}
