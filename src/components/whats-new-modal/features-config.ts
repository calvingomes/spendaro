import { Zap, PiggyBank, Compass } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.4.0";

export const RELEASE_FEATURES = [
  {
    id: "savings-pot",
    icon: PiggyBank,
    title: "Introducting Pots",
    description: "A smart way to segregate your savings for various purposes."
  },
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
  }
];
