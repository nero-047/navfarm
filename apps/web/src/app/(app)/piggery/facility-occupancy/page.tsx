"use client";

import { PiggeryPageShell } from "@/components/console/piggery/piggery-page-shell";
import FacilityOccupancyPanel from "@/components/console/piggery/facility-occupancy-panel";

export default function PiggeryFacilityOccupancyPage() {
  return (
    <PiggeryPageShell activeKey="facility-occupancy">
      <FacilityOccupancyPanel />
    </PiggeryPageShell>
  );
}
