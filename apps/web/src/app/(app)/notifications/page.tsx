"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/notifications/email");
  }, [router]);
  return null;
}
