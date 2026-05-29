import { Zap, ShieldCheck, Compass } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.3.0";

export const RELEASE_FEATURES = [
  {
    id: "zen-balance",
    icon: ShieldCheck,
    title: "All-New Balance Layout",
    description: "A clean, balance banner with side-by-side summaries for income, expenses, and savings."
  },
  {
    id: "donut-analytics",
    icon: Zap,
    title: "Refined Analytics",
    description: "Sleek charts showing exact values and compact summary notations."
  },
  {
    id: "nav",
    icon: Compass,
    title: "Simple Navigation",
    description: "Switch effortlessly between your transactions list, visual charts, and profile settings."
  }
];
