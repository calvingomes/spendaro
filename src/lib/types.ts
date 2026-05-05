export type Expense = {
  id: string;
  user_id: string;
  label: string;
  category: string;
  amount: string;
  type: "credit" | "debit";
  created_at: string;
  updated_at: string;
};
