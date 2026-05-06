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
        <img src="/icons/icon-192x192.png" alt="Spendaro Logo" className={styles.logo} />
        <h1 className={styles.title}>Sign in to Spendaro</h1>
        <SignInButton />
      </section>
    </main>
  );
}
