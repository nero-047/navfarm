"use client";

import { PiggeryPageShell } from "@/components/console/piggery/piggery-page-shell";
import AnimalPanel from "@/components/console/piggery/animal-panel";

export default function PiggeryAnimalsPage() {
  return (
    <PiggeryPageShell activeKey="animals">
      <AnimalPanel />
    </PiggeryPageShell>
  );
}
