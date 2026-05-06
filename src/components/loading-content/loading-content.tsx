import styles from "./loading.module.css";

export function LoadingContent() {
  return (
    <main className={styles.container}>
      <div className={styles.loader} aria-label="Loading Spendaro..." />
    </main>
  );
}
