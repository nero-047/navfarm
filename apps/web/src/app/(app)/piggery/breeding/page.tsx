"use client";

import { PiggeryPageShell } from "@/components/console/piggery/piggery-page-shell";
import { BreedingPanel } from "@/components/console/piggery/breeding-panel";

export default function PiggeryBreedingPage() {
  return (
    <PiggeryPageShell activeKey="breeding">
      <BreedingPanel />
    </PiggeryPageShell>
  );
}
