"use client";

import { FinancePageShell } from "@/components/console/finance/finance-page-shell";
import ExchangeRatePanel from "@/components/console/finance/exchange-rate-panel";

export default function FinanceExchangeRatesPage() {
  return (
    <FinancePageShell activeKey="exchange-rates">
      <ExchangeRatePanel />
    </FinancePageShell>
  );
}
