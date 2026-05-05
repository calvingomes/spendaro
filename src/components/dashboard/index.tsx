import Link from "next/link";
import styles from "./dashboard.module.css";
import { SignOutButton } from "../auth/sign-out-button";

const stats = [
  { label: "This month", value: "$0.00" },
  { label: "Average spend", value: "$0.00" },
  { label: "Top category", value: "None yet" }
];

export function Dashboard({ userEmail }: { userEmail: string }) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Spendaro</p>
          <h1 className={styles.title}>Track expenses with a dashboard built for speed.</h1>
          <p className={styles.copy}>
            Signed in as <strong>{userEmail}</strong>. Add an expense in seconds and watch the analytics update in real
            time.
          </p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Auth & storage</p>
          <h2 className={styles.cardTitle}>Next.js + Supabase</h2>
          <p className={styles.cardCopy}>
            The app is scaffolded for Supabase auth, server routes, and future mobile shortcuts.
          </p>
          <Link href="/sign-in">Switch account</Link>
          <SignOutButton />
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

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Recent expenses</h3>
            <span className={styles.panelMeta}>Ready for Supabase data</span>
          </div>
          <div className={styles.emptyState}>Your transactions will appear here once we wire in Supabase.</div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Analytics</h3>
            <span className={styles.panelMeta}>Ready for charts</span>
          </div>
          <div className={styles.chartPlaceholder}>
            Charts for category mix and spending trends will live here in the next phase.
          </div>
        </article>
      </section>
    </main>
  );
}
