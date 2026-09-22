export type Expense = {
  id: string;
  user_id: string;
  label: string;
  category: string;
  amount: number;
  type: "credit" | "debit" | "savings";
  pot_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type Pot = {
  id: string;
  user_id: string;
  name: string;
  goal: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Peer = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type SplitPeerEntry = {
  id: string;
  split_id: string;
  user_id: string;
  peer_id: string;
  amount_owed: number;
  amount_repaid: number;
  created_at: string;
  updated_at: string;
};

export type SplitPeerBreakdown = {
  peer_id: string;
  peer_name: string;
  amount_owed: number;
  amount_repaid: number;
};

export type Split = {
  id: string;
  user_id: string;
  source_expense_id: string;
  peer_ledger_expense_id: string;
  label: string;
  category: string;
  my_share: number;
  peer_total: number;
  split_method: "equal" | "percentage" | "specific";
  note: string | null;
  status: "open" | "voided";
  created_at: string;
  updated_at: string;
  peer_breakdown: SplitPeerBreakdown[];
};

export type NavTab = "home" | "transactions" | "pots" | "split" | "profile";
