import styles from "./sign-in.module.css";
import { SignInButton } from "@/components/auth/sign-in-button";

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Spendaro</p>
        <h1 className={styles.title}>Sign in to your expense dashboard</h1>
        <p className={styles.copy}>Use Google to access your private dashboard and track spending securely.</p>
        <SignInButton />
        <p className={styles.finePrint}>By continuing, you’ll be signed into your personal workspace.</p>
      </section>
    </main>
  );
}
