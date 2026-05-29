import { Zap, ShieldCheck, Compass } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.4.0";

export const RELEASE_FEATURES = [
  {
    id: "dedicated-transactions",
    icon: Compass,
    title: "Dedicated Transactions Workspace",
    description: "A brand-new dedicated page to search, scope, and filter all transactions."
  },
  {
    id: "dedicated-analytics",
    icon: Zap,
    title: "Dedicated Analytics View",
    description: "A fresh visual dashboard displaying beautiful expense vs. income distribution and customizable time ranges."
  },
  {
    id: "zen-balance",
    icon: ShieldCheck,
    title: "All-New Balance Layout",
    description: "A clean, balance banner with side-by-side summaries for income, expenses, and savings."
  }
];
