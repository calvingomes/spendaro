import { Zap, ChartPie, PiggyBank } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.7.0";

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
    id: "instant-updates",
    icon: Zap,
    title: "Instant Updates",
    description: "Adding or editing expenses and pots now happens instantly with no loading delays."
  }
];
