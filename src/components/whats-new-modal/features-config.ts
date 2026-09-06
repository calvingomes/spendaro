import { Zap, PiggyBank, Rocket } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.7.0";

export const RELEASE_FEATURES = [
  {
    id: "faster-startup",
    icon: Rocket,
    title: "Instant App Launch",
    description: "The app now opens immediately with a branded launch screen instead of waiting on a blank screen."
  },
  {
    id: "instant-updates",
    icon: Zap,
    title: "Instant Updates",
    description: "Adding or editing expenses and pots now happens instantly with no loading delays."
  },
  {
    id: "pots-reduce-main-balance",
    icon: PiggyBank,
    title: "Pots Reduce Main Balance",
    description: "Money assigned to pots is now deducted from your main balance."
  }
];
