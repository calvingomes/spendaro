import styles from "./dashboard.module.css";
import { SignOutButton } from "../auth/sign-out-button";
import { ExpenseWorkspace } from "../expenses/expense-workspace";
import type { Expense } from "@/lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

export function Dashboard({
  userEmail,
  initialExpenses
}: {
  userEmail: string;
  initialExpenses: Expense[];
}) {
  const now = new Date();
  const thisMonthSpent = initialExpenses.reduce((total, expense) => {
    const createdAt = new Date(expense.created_at);
    if (createdAt.getMonth() !== now.getMonth() || createdAt.getFullYear() !== now.getFullYear()) {
      return total;
    }

    const amount = Number.parseFloat(expense.amount);
    return total + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  const totalSpent = initialExpenses.reduce((total, expense) => {
    const amount = Number.parseFloat(expense.amount);
    return total + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  const averageSpend = initialExpenses.length > 0 ? totalSpent / initialExpenses.length : 0;

  const categoryCount = new Map<string, number>();
  for (const expense of initialExpenses) {
    categoryCount.set(expense.category, (categoryCount.get(expense.category) ?? 0) + 1);
  }

  const topCategory = [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";

  const stats = [
    { label: "This month", value: formatCurrency(thisMonthSpent) },
    { label: "Average spend", value: formatCurrency(averageSpend) },
    { label: "Top category", value: topCategory }
  ];

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
