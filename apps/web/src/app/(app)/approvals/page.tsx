"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/approvals/pending");
  }, [router]);
  return null;
}
