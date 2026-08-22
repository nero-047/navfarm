"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductionIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/production/batches/daily-entry");
  }, [router]);
  return null;
}
