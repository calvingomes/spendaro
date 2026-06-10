"use client";

import { ReceiptText, BarChart3, User, PlusCircle, PiggyBank, LucideIcon } from "lucide-react";
import styles from "./mobile-navigation.module.css";
import clsx from "clsx";
import type { NavTab } from "@/lib/types";

interface MobileNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

interface TabItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "pots", label: "Pots", icon: PiggyBank },
  { id: "add", label: "Add", icon: PlusCircle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];

export function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps) {
  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      <div className={styles.mobileNavInner}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              className={clsx(styles.mobileButton, isActive && styles.activeMobileButton)}
              onClick={() => onTabChange(id)}
            >
              <div className={styles.mobileIconWrapper}>
                <Icon size={20} className={styles.mobileIcon} />
              </div>
              <span className={styles.mobileLabel}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
