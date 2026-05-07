"use client";

import styles from "./add-expense-button.module.css";

export function AddExpenseButton() {
  return (
    <button
      className={styles.addButton}
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("xpenses:add-expense"))}
    >
      Add expense
    </button>
  );
}
