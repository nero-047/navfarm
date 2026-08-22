"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MASTER_DATA_CONFIGS } from "@/modules/master-data/configs";

export default function MasterDataIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/master-data/${MASTER_DATA_CONFIGS[0].key}`);
  }, [router]);
  return null;
}
