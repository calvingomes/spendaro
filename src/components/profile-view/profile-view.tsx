"use client";

import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle/theme-toggle";
import { SignOutButton } from "@/components/buttons/sign-out-button/sign-out-button";
import { User as UserIcon, Mail, Calendar, Settings2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import styles from "./profile-view.module.css";

interface ProfileViewProps {
  user: User;
}

export function ProfileView({ user }: ProfileViewProps) {
  const email = user.email;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || "User";
  const avatarUrl = user.user_metadata?.avatar_url;
  const createdAt = user.created_at;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Account Settings</h2>

      <div className={styles.grid}>
        {/* User Card */}
        <div className={`${styles.card} surface radius-3`}>
          <div className={styles.profileHeader}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name || "User Profile"}
                className={styles.avatar}
                width={56}
                height={56}
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <UserIcon size={32} className={styles.avatarIcon} />
              </div>
            )}
            <div className={styles.profileDetails}>
              <h3 className={styles.profileName}>{name}</h3>
              <p className={styles.profileRole}>Member</p>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <Mail size={16} className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Email address</span>
                <span className={styles.infoValue}>{email || "No email available"}</span>
              </div>
            </div>

            <div className={styles.infoItem}>
              <Calendar size={16} className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Joined</span>
                <span className={styles.infoValue}>
                  {createdAt
                    ? new Date(createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown date"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences / Customization Card */}
        <div className={`${styles.card} surface radius-3`}>
          <div className={styles.cardHeader}>
            <Settings2 size={18} className={styles.cardHeaderIcon} />
            <h4 className={styles.cardTitle}>Preferences</h4>
          </div>

          <div className={styles.prefList}>
            <div className={styles.prefItem}>
              <div className={styles.prefText}>
                <span className={styles.prefLabel}>Appearance</span>
                <span className={styles.prefDesc}>Customize how Xpenses looks on your device</span>
              </div>
              <div className={styles.themeToggleWrapper}>
                <ThemeToggle />
              </div>
            </div>

            <div className={styles.prefItem}>
              <div className={styles.prefText}>
                <span className={styles.prefLabel}>Sign Out</span>
                <span className={styles.prefDesc}>Securely sign out of your current session</span>
              </div>
              <div className={styles.signOutWrapper}>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
