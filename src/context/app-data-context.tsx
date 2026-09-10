"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Expense, Pot } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getLocalExpenses, getLocalPots, saveLocalExpenses, saveLocalPots } from "@/utils/db";
import { getQueuedActions } from "@/utils/sync-queue";

type AppDataState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "ready"; user: User; expenses: Expense[]; pots: Pot[] };

type AppDataContextValue = {
  state: AppDataState;
  setExpenses: (expenses: Expense[]) => void;
  setPots: (pots: Pot[]) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setAppState] = useState<AppDataState>({ status: "loading" });
  const bootstrapped = useRef(false);

  const setExpenses = (expenses: Expense[]) => {
    setAppState((prev) =>
      prev.status === "ready" ? { ...prev, expenses } : prev
    );
  };

  const setPots = (pots: Pot[]) => {
    setAppState((prev) =>
      prev.status === "ready" ? { ...prev, pots } : prev
    );
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const bootstrap = async () => {
      const [[cachedExpenses, cachedPots], { data: { session } }] = await Promise.all([
        Promise.all([getLocalExpenses(), getLocalPots()]),
        supabase.auth.getSession(),
      ]);

      if (cancelled) return;

      if (!session?.user) {
        setAppState({ status: "unauthenticated" });
        return;
      }

      setAppState({ status: "ready", user: session.user, expenses: cachedExpenses, pots: cachedPots });

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
          setAppState((prev) => {
            if (prev.status !== "ready") return prev;
            const next = body.expenses as Expense[];
            if (
              prev.expenses.length === next.length &&
              prev.expenses.every(
                (item, idx) =>
                  item.id === next[idx].id &&
                  item.amount === next[idx].amount &&
                  item.updated_at === next[idx].updated_at
              )
            ) {
              return prev;
            }
            return { ...prev, expenses: next };
          });
        }
      }

      if (potsResponse.ok) {
        const body = await potsResponse.json();
        await saveLocalPots(body);
        setAppState((prev) => {
          if (prev.status !== "ready") return prev;
          const next = body as Pot[];
          if (
            prev.pots.length === next.length &&
            prev.pots.every(
              (item, idx) =>
                item.id === next[idx].id &&
                item.name === next[idx].name &&
                item.goal === next[idx].goal &&
                item.color === next[idx].color
            )
          ) {
            return prev;
          }
          return { ...prev, pots: next };
        });
      }
    };

    bootstrap().catch((err) => console.error("AppDataProvider bootstrap failed:", err));

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (state.status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [state.status, router]);

  return (
    <AppDataContext.Provider value={{ state, setExpenses, setPots }}>
      {children}
    </AppDataContext.Provider>
  );
}
