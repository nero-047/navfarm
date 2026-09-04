"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MASTER_DATA_CONFIGS } from "@/modules/master-data/configs";

export default function MasterDataIndexPage() {
  const router = useRouter();
  useEffect(() => {
    const first = MASTER_DATA_CONFIGS.find((c) => c.isPrimary) ?? MASTER_DATA_CONFIGS[0];
    router.replace(`/master-data/${first.key}`);
  }, [router]);
  return null;
}
