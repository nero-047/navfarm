"use client";

import { LivestockPageShell } from "@/components/console/livestock/livestock-page-shell";
import HerdAnalyticsPanel from "@/components/console/piggery/herd-analytics-panel";

export default function PiggeryHerdAnalyticsPage() {
  return (
    <LivestockPageShell activeKey="analytics">
      <HerdAnalyticsPanel />
    </LivestockPageShell>
  );
}
