import styles from "./sign-in.module.css";
import { SignInButton } from "@/components/auth/sign-in-button";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SignInPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
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
