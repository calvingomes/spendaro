"use client";

import { ReceiptText, BarChart3, User, LucideIcon } from "lucide-react";
import styles from "./navigation.module.css";
import clsx from "clsx";

export type NavTab = "transactions" | "analytics" | "profile";

interface NavigationProps {
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
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <>
      {/* Desktop Navigation Tab Bar */}
      <nav className={styles.desktopNav} aria-label="Desktop navigation">
        <div className={styles.desktopNavInner}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                className={clsx(styles.desktopButton, isActive && styles.activeDesktopButton)}
                onClick={() => onTabChange(id)}
              >
                <Icon size={16} className={styles.desktopIcon} />
                <span>{label}</span>
                {isActive && <div className={styles.desktopActiveIndicator} />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
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
    </>
  );
}
