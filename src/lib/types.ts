export type Expense = {
  id: string;
  user_id: string;
  label: string;
  category: string;
  amount: string;
  type: "credit" | "debit" | "savings";
  pot_id?: string | null;
  subscription_id?: string | null;
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

export type Subscription = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: string;
  renewal_day: number;
  created_at: string;
  updated_at: string;
};

export type NavTab = "add" | "transactions" | "analytics" | "pots" | "subscriptions" | "profile";
