import Image from "next/image";
import styles from "./sign-in.module.css";
import { SignInButton } from "@/components/buttons/sign-in-button/sign-in-button";
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
        <Image src="/icons/icon-192x192.png" alt="Xpenses Logo" width={64} height={64} className={styles.logo} unoptimized />
        <h1 className={styles.title}>Sign in to Xpenses</h1>
        <SignInButton />
      </section>
    </main>
  );
}
