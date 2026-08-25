"use client";

import { PiggeryPageShell } from "@/components/console/piggery/piggery-page-shell";
import HerdAnalyticsPanel from "@/components/console/piggery/herd-analytics-panel";

export default function PiggeryHerdAnalyticsPage() {
  return (
    <PiggeryPageShell activeKey="herd-analytics">
      <HerdAnalyticsPanel />
    </PiggeryPageShell>
  );
}
