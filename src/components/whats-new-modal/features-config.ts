import { Zap, Navigation, LayoutDashboard } from "lucide-react";

export const CURRENT_VERSION = "2.0.0";

export const RELEASE_FEATURES = [
  {
    id: "modal-on-dashboard",
    icon: LayoutDashboard,
    title: "Add Lives on Dashboard",
    description: "The add transaction modal is now fully integrated into the dashboard — no separate screen, no loading delay."
  },
  {
    id: "nav-restructure",
    icon: Navigation,
    title: "Cleaner Navigation",
    description: "Bottom nav is now Home, Transactions, +, Pots, Analytics. Profile moved to the top-right avatar."
  },
  {
    id: "instant-open",
    icon: Zap,
    title: "Instant on Launch",
    description: "App opens directly to the add transaction modal. Close it to see your dashboard."
  }
];
