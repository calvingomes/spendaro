import { LayoutDashboard, Calculator, UsersRound } from "lucide-react";

export const CURRENT_VERSION = "2.6.0";

export const RELEASE_FEATURES = [
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
  },
  {
    id: "splits-screen",
    icon: UsersRound,
    title: "Split expenses",
    description: "Track shared bills with friends. Your share hits analytics instantly; peer repayments keep your balance in sync over time."
  }
];
