"use client";

import { useState, useEffect, useRef } from "react";
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
  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);
  const [isShrunk, setIsShrunk] = useState(false);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target;
      // Read scroll position from the scrolling element (window or any inner container)
      const currentScrollY = target === document
        ? window.scrollY
        : target instanceof HTMLElement ? target.scrollTop : 0;

      const delta = currentScrollY - lastScrollRef.current;

      // Ignore tiny movements
      if (Math.abs(delta) < 10) return;

      if (delta > 0 && currentScrollY > 30) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
      lastScrollRef.current = currentScrollY;
    };

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  return (
    <nav
      className={clsx(styles.mobileNav, isShrunk && styles.shrunk)}
      aria-label="Mobile navigation"
    >
      <div
        className={styles.mobileNavInner}
        style={{
          "--active-index": activeIndex !== -1 ? activeIndex : 0,
          "--options-count": TABS.length,
        } as React.CSSProperties}
      >
        <div className={styles.indicator}>
          <div className={styles.indicatorInner} />
        </div>
        {TABS.map(({ id, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              className={clsx(styles.mobileButton, isActive && styles.activeMobileButton)}
              onClick={() => onTabChange(id)}
            >
              <Icon size={22} className={styles.mobileIcon} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
