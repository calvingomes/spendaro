import { TrendingUp, Zap, CheckCircle } from "lucide-react";

export const CURRENT_VERSION = "2.3.0";

export const RELEASE_FEATURES = [
  {
    id: "top-categories",
    icon: TrendingUp,
    title: "Smarter Home Tab",
    description: "The dashboard now surfaces your top spending categories from the last 30 days."
  },
  {
    id: "add-from-anywhere",
    icon: Zap,
    title: "Add from Anywhere",
    description: "The + button opens the add modal from every screen — Pots, Analytics, Profile — not just the home tab."
  },
  {
    id: "edit-toggle",
    icon: CheckCircle,
    title: "Switch Type on Edit",
    description: "You can now change a transaction between Expense and Income when editing it."
  }
];
