"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LogOut } from "lucide-react";
import styles from "./sign-out-button.module.css";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/sign-in");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button className={styles.button} type="button" onClick={handleSignOut} disabled={isLoading} title="Sign out">
      <LogOut className={styles.icon} />
      <span className={styles.text}>{isLoading ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}
