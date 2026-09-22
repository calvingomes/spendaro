"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Expense, Peer, Pot, Split } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { DEFAULT_CATEGORIES, SPLIT_CATEGORY_TAG, normalizeText } from "@/utils/expense-utils";
import { getLocalCategories, getLocalExpenses, getLocalPeers, getLocalPots, getLocalSplits, saveLocalCategory, deleteLocalCategory, saveLocalExpenses, saveLocalPeers, saveLocalPots, saveLocalSplits, syncCategoriesFromExpenses } from "@/utils/db";
import { getQueuedActions } from "@/utils/sync-queue";

type AppDataState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "hydrating"; user: User; expenses: Expense[]; pots: Pot[]; peers: Peer[]; splits: Split[] }
  | { status: "ready"; user: User; expenses: Expense[]; pots: Pot[]; peers: Peer[]; splits: Split[] };

type AppDataContextValue = {
  state: AppDataState;
  setExpenses: (expenses: Expense[]) => void;
  setPots: (pots: Pot[]) => void;
  setPeers: (peers: Peer[]) => void;
  setSplits: (splits: Split[]) => void;
  categories: string[];
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
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
  const [categories, setCategories] = useState<string[]>([]);
  const bootstrapped = useRef(false);

  const setExpenses = (expenses: Expense[]) => {
    setAppState((prev) =>
      prev.status === "ready" || prev.status === "hydrating" ? { ...prev, expenses } : prev
    );
  };

  const setPots = (pots: Pot[]) => {
    setAppState((prev) =>
      prev.status === "ready" || prev.status === "hydrating" ? { ...prev, pots } : prev
    );
  };

  const setPeers = (peers: Peer[]) => {
    setAppState((prev) =>
      prev.status === "ready" || prev.status === "hydrating" ? { ...prev, peers } : prev
    );
  };

  const setSplits = (splits: Split[]) => {
    setAppState((prev) =>
      prev.status === "ready" || prev.status === "hydrating" ? { ...prev, splits } : prev
    );
  };

  const addCategory = (name: string) => {
    const normalized = normalizeText(name);
    if (!normalized || normalized === SPLIT_CATEGORY_TAG || normalized.toLowerCase() === "splits" || normalized.startsWith("_")) return;
    setCategories((prev) =>
      prev.some((c) => c.toLowerCase() === normalized.toLowerCase()) ? prev : [normalized, ...prev]
    );
    void saveLocalCategory(normalized);
  };

  const removeCategory = (name: string) => {
    const normalized = normalizeText(name);
    setCategories((prev) => prev.filter((c) => c.toLowerCase() !== normalized.toLowerCase()));
    void deleteLocalCategory(normalized);
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session?.user) {
        setAppState({ status: "unauthenticated" });
        return;
      }

      setAppState({ status: "hydrating", user: session.user, expenses: [], pots: [], peers: [], splits: [] });

      const [cachedExpenses, cachedPots, cachedPeers, cachedSplits] = await Promise.all([
        getLocalExpenses(),
        getLocalPots(),
        getLocalPeers(),
        getLocalSplits(),
      ]);

      if (cancelled) return;

      await syncCategoriesFromExpenses(cachedExpenses, DEFAULT_CATEGORIES);
      const cachedCategories = await getLocalCategories();
      setCategories(cachedCategories.filter((c) => c !== SPLIT_CATEGORY_TAG));

      setAppState({ status: "ready", user: session.user, expenses: cachedExpenses, pots: cachedPots, peers: cachedPeers, splits: cachedSplits });

      if (getQueuedActions().length > 0) return;

      const [expensesResponse, potsResponse, peersResponse, splitsResponse] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/pots"),
        fetch("/api/peers"),
        fetch("/api/splits"),
      ]);

      if (cancelled) return;

      if (expensesResponse.ok) {
        const body = await expensesResponse.json();
        if (body.expenses) {
          const next = body.expenses as Expense[];
          await saveLocalExpenses(next);
          setAppState((prev) => {
            if (prev.status !== "ready") return prev;
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
        const next = body as Pot[];
        await saveLocalPots(next);
        setAppState((prev) => {
          if (prev.status !== "ready") return prev;
          if (prev.pots.length === next.length && prev.pots.every((item, idx) => item.id === next[idx].id && item.name === next[idx].name)) return prev;
          return { ...prev, pots: next };
        });
      }

      if (peersResponse.ok) {
        const body = await peersResponse.json();
        const next = (body.peers || body) as Peer[];
        await saveLocalPeers(next);
        setAppState((prev) => prev.status !== "ready" ? prev : { ...prev, peers: next });
      }

      if (splitsResponse.ok) {
        const body = await splitsResponse.json();
        const next = (body.splits || body) as Split[];
        await saveLocalSplits(next);
        setAppState((prev) => prev.status !== "ready" ? prev : { ...prev, splits: next });
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
    <AppDataContext.Provider value={{ state, setExpenses, setPots, setPeers, setSplits, categories, addCategory, removeCategory }}>
      {children}
    </AppDataContext.Provider>
  );
}
