"use client";

import { FinancePageShell } from "@/components/console/finance/finance-page-shell";
import JournalPanel from "@/components/console/finance/journal-panel";

export default function FinanceJournalPage() {
  return (
    <FinancePageShell activeKey="journal">
      <JournalPanel />
    </FinancePageShell>
  );
}
