"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { Expense, NavTab, Pot } from "@/lib/types";

export type DashboardContextValue = {
  user: User;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  pots: Pot[];
  setPots: (pots: Pot[]) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
};

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardContext.Provider");
  return ctx;
}
