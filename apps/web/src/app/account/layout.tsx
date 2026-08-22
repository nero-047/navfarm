"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStoredToken, getStoredUser, clearSession, type NavUser } from "@/hooks/useAuth";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/hooks/useLanguage";

const NAVFARM_LOGO_SRC = "https://nav-cdn.pages.dev/images/favicon.png";

/**
 * Deliberately lighter chrome than AppShell — this is personal account
 * space, not an operational workspace, and it needs to work identically for
 * every user type (system admin included, who never enters /console at
 * all). A single shared shell avoids building this twice.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      router.replace("/");
      return;
    }
    setUser(storedUser);
    setReady(true);
  }, [router]);

  const backHref = user?.userType === "SYSTEM_ADMIN" ? "/admin/dashboard" : "/console/dashboard";

  const handleSignOut = () => {
    clearSession();
    router.replace("/");
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header
        className="sticky top-0 z-20 flex h-14 items-center gap-4 px-4 sm:px-6"
        style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href={backHref} className="flex items-center gap-2 shrink-0">
          <img src={NAVFARM_LOGO_SRC} alt="Navfarm" className="h-6 w-6 rounded-[var(--radius-xs)]" />
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            NAV<span style={{ color: "var(--accent)" }}>Farm</span>
          </span>
        </Link>
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-[13px] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={14} />
          {t("backToConsole")}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />
          <ThemeSelector />
          <button
            onClick={handleSignOut}
            className="ml-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] font-medium"
            style={{ color: "var(--danger)" }}
          >
            {t("signOut")}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
