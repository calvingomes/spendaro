"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Expense, Pot } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getLocalExpenses, getLocalPots, saveLocalExpenses, saveLocalPots } from "@/utils/db";
import { getQueuedActions } from "@/utils/sync-queue";
import { Dashboard } from "@/components/dashboard-view/dashboard";
import { LoadingContent } from "@/components/loading-content/loading-content";

type BootstrapState = {
  user: User;
  expenses: Expense[];
  pots: Pot[];
};

export function DashboardBootstrap() {
  const router = useRouter();
  const [state, setState] = useState<BootstrapState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/sign-in");
        return;
      }

      const [cachedExpenses, cachedPots] = await Promise.all([
        getLocalExpenses(),
        getLocalPots(),
      ]);

      if (cancelled) return;

      setState({ user: session.user, expenses: cachedExpenses, pots: cachedPots });

      // Leave queued optimistic changes in control until they have synced.
      if (getQueuedActions().length > 0) return;

      const [expensesResponse, potsResponse] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/pots"),
      ]);

      if (cancelled) return;

      if (expensesResponse.ok) {
        const body = await expensesResponse.json();
        if (body.expenses) {
          await saveLocalExpenses(body.expenses);
          setState((current) => {
            if (!current) return current;
            const prev = current.expenses;
            const next = body.expenses as Expense[];
            if (
              prev.length === next.length &&
              prev.every(
                (item, idx) =>
                  item.id === next[idx].id &&
                  item.amount === next[idx].amount &&
                  item.updated_at === next[idx].updated_at
              )
            ) {
              return current;
            }
            return { ...current, expenses: next };
          });
        }
      }

      if (potsResponse.ok) {
        const body = await potsResponse.json();
        await saveLocalPots(body);
        setState((current) => {
          if (!current) return current;
          const prev = current.pots;
          const next = body as Pot[];
          if (
            prev.length === next.length &&
            prev.every(
              (item, idx) =>
                item.id === next[idx].id &&
                item.name === next[idx].name &&
                item.goal === next[idx].goal &&
                item.color === next[idx].color
            )
          ) {
            return current;
          }
          return { ...current, pots: next };
        });
      }
    };

    bootstrap().catch((error) => {
      console.error("Failed to bootstrap dashboard:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!state) return <LoadingContent />;

  return (
    <Dashboard
      initialExpenses={state.expenses}
      initialPots={state.pots}
      user={state.user}
    />
  );
}
