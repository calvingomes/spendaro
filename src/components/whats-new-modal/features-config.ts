import { Bug, ChartPie, PiggyBank } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.6.0";

export const RELEASE_FEATURES = [
  {
    id: "net-expenses",
    icon: ChartPie,
    title: "Net Expenses",
    description: "See your actual spending after credits and refunds are deducted."
  },
  {
    id: "pots-reduce-main-balance",
    icon: PiggyBank,
    title: "Pots Reduce Main Balance",
    description: "Money assigned to pots is now deducted from your main balance."
  },
  {
    id: "bug-fixes",
    icon: Bug,
    title: "Bug Fixes",
    description: "Various fixes and improvements for a smoother experience."
  }
];
