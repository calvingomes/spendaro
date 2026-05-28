import { Zap, ShieldCheck, Compass } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.2.0";

export const RELEASE_FEATURES = [
  {
    id: "nav",
    icon: Compass,
    title: "Sleek Switcher & Settings",
    description: "Navigate effortlessly between Transactions, Analytics, and Settings via custom tabs—including a dedicated, flat bottom dock for installed mobile apps."
  },
  {
    id: "sync",
    icon: Zap,
    title: "Worry-Free Offline Mode",
    description: "Log expenses anytime, anywhere. They will automatically save to your account the moment you're back online."
  }
];
