import { LayoutDashboard, Calculator, UsersRound } from "lucide-react";

export const CURRENT_VERSION = "2.7.0";

export const RELEASE_FEATURES = [
  {
    id: "splits-screen",
    icon: UsersRound,
    title: "Split expenses",
    description: "Track who owes whom, record repayments, settle or void individual shares, and review split history."
  },
  {
    id: "consolidated-view",
    icon: LayoutDashboard,
    title: "Consolidated Transactions view",
    description: "Transactions and Analytics now live together in one screen with a simple toggle between views."
  },
  {
    id: "net-expenses",
    icon: Calculator,
    title: "Net Expenses",
    description: "See your actual spending after same-category income and reimbursements are accounted for."
  }
];
