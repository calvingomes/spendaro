import { Zap, Navigation, Route, PiggyBank } from "lucide-react";

export const CURRENT_VERSION = "1.9.0";

export const RELEASE_FEATURES = [
  {
    id: "instant-add",
    icon: Zap,
    title: "Instant Add Screen",
    description: "The add screen now opens immediately with no loading delay. Categories load from local storage."
  },
  {
    id: "nav-restructure",
    icon: Navigation,
    title: "Cleaner Navigation",
    description: "Bottom nav is now Home, Transactions, +, Pots, Analytics. Profile moved to the top-right avatar."
  },
  {
    id: "debit-credit-toggle",
    icon: PiggyBank,
    title: "Unified Add Modal",
    description: "Debit and Credit are now a single modal with a toggle — one tap to switch between expense and income."
  }
];
