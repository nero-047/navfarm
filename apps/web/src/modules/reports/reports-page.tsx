'use client';

import { useState } from 'react';
import BalanceSheetPanel from '@/components/console/finance/balance-sheet-panel';
import ProfitLossPanel from '@/components/console/finance/profit-loss-panel';
import TrialBalancePanel from '@/components/console/finance/trial-balance-panel';
import { PageHeader, SegmentedControl } from '@/components/ui/primitives';

const tabs = [
  { value: 'profit-loss', label: 'Profit & loss' },
  { value: 'trial-balance', label: 'Trial balance' },
  { value: 'balance-sheet', label: 'Balance sheet' },
];

export function ReportsPage() {
  const [tab, setTab] = useState('profit-loss');
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance & variance"
        title="Reports"
        description="Company-scoped financial statements derived from posted inventory, production and journal activity."
      />
      <SegmentedControl value={tab} options={tabs} onChange={setTab} />
      {tab === 'profit-loss' && <ProfitLossPanel />}
      {tab === 'trial-balance' && <TrialBalancePanel />}
      {tab === 'balance-sheet' && <BalanceSheetPanel />}
    </div>
  );
}
