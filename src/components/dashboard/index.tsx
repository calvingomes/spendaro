import styles from "./dashboard.module.css";
import { SignOutButton } from "../auth/sign-out-button";
import { ExpenseWorkspace } from "../expenses/expense-workspace";
import type { Expense } from "@/lib/types";

const stats = [
  { label: "This month", value: "₹0.00" },
  { label: "Average spend", value: "₹0.00" },
  { label: "Top category", value: "None yet" }
];

export function Dashboard({
  userEmail,
  initialExpenses
}: {
  userEmail: string;
  initialExpenses: Expense[];
}) {
  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          <div>
            <p className={styles.brandName}>Spendaro</p>
          </div>
        </div>
        <div className={styles.topActions}>
          <span className={styles.accountPill}>{userEmail}</span>
          <SignOutButton />
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <h1 className={styles.title}>Expenses</h1>
        </div>
      </section>

      <section className={styles.statsGrid}>
        {stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <strong className={styles.statValue}>{stat.value}</strong>
          </article>
        ))}
      </section>

      <ExpenseWorkspace initialExpenses={initialExpenses} />
    </main>
  );
}
