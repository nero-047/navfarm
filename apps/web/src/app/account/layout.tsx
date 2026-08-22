"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken, getStoredUser } from "@/hooks/useAuth";

/**
 * Auth gate only — no visual chrome. Profile and Settings render as a
 * Dialog (see the Dialog primitive in components/ui/dialog.tsx) so the
 * URL changes and the page is bookmarkable/shareable, but visiting it
 * reads as a focused overlay rather than a full destination page, matching
 * how the rest of the app treats "account-level" actions vs operational
 * workspace pages.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>{children}</div>;
}
