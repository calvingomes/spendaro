"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useState } from "react";

export function SignInButton() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Connecting..." : "Continue with Google"}
      </button>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </div>
  );
}
