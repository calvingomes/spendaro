"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { Expense, NavTab, Peer, Pot, Split } from "@/lib/types";

export type DashboardContextValue = {
  user: User;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  pots: Pot[];
  setPots: (pots: Pot[]) => void;
  peers: Peer[];
  setPeers: (peers: Peer[]) => void;
  splits: Split[];
  setSplits: (splits: Split[]) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isExpenseModalOpen: boolean;
  editingExpense: Expense | null;
  prefillFrom: Expense | null;
  modalDefaultType: "credit" | "debit";
  openExpenseModal: (opts?: {
    defaultType?: "credit" | "debit";
    editingExpense?: Expense | null;
    prefillFrom?: Expense | null;
  }) => void;
  closeExpenseModal: () => void;
  justAddedId: string | null;
  setJustAddedId: (id: string | null) => void;
  isSplitModalOpen: boolean;
  openSplitModal: () => void;
  closeSplitModal: () => void;
  activePeerId: string | null;
  openPeerDetail: (peerId: string) => void;
  closePeerDetail: () => void;
};

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardContext.Provider");
  return ctx;
}
