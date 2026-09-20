import { LayoutDashboard, Calculator, PiggyBank } from "lucide-react";

export const CURRENT_VERSION = "2.5.0";

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
    id: "pots-balance",
    icon: PiggyBank,
    title: "Pots affect available balance",
    description: "Money added to a pot now reduces the available main balance until it is moved back."
  }
];
