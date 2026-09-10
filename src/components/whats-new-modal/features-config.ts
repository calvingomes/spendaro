import { TrendingUp, Copy } from "lucide-react";

export const CURRENT_VERSION = "2.4.1";

export const RELEASE_FEATURES = [
  {
    id: "duplicate",
    icon: Copy,
    title: "Duplicate a transaction",
    description: "Every row now has a Duplicate button. Tap it to open the add modal prefilled with that row's label, category, amount, and type."
  },
  {
    id: "top-categories",
    icon: TrendingUp,
    title: "Smarter Home Tab",
    description: "The dashboard now surfaces your top spending categories from the last 30 days."
  }
];
