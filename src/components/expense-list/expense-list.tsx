"use client";

import { useMemo, useState } from "react";
import { Plus, ArrowUpRight, ArrowDownLeft, Pencil, Search } from "lucide-react";
import styles from "./expense-list.module.css";
import { formatCurrency } from "@/utils/expense-utils";
import type { Expense } from "@/lib/types";

interface ExpenseListProps {
  expenses: Expense[];
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
  isPending: boolean;
}

export function ExpenseList({ expenses, onAdd, onEdit, isPending }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => 
      e.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  return (
    <article className={styles.listCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionKicker}>Activity</p>
          <h2 className={styles.sectionTitle}>Recent transactions</h2>
        </div>
        <div className={styles.sectionActions}>
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
        <div className={styles.tableWrap}>
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
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className={styles.labelCell}>{expense.label}</td>
                  <td className={`${styles.amountCell} ${expense.type === "credit" ? styles.positive : styles.negative}`}>
                    <div className={styles.amountContent}>
                      {expense.type === "credit" ? (
                        <ArrowUpRight className={styles.amountIcon} />
                      ) : (
                        <ArrowDownLeft className={styles.amountIcon} />
                      )}
                      {formatCurrency(expense.amount)}
                    </div>
                  </td>
                  <td>{expense.category}</td>
                  <td>{new Date(expense.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button className={styles.tableButton} type="button" onClick={() => onEdit(expense)} disabled={isPending} title="Edit">
                        <Pencil className={styles.tableIcon} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
