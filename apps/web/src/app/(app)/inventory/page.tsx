"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InventoryIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/inventory/balance");
  }, [router]);
  return null;
}
