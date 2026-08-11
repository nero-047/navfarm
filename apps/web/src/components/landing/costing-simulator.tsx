import React from 'react';
import {
  Cpu,
  FileSpreadsheet,
  ArrowRightLeft,
  Coins,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';

interface CostingSimulatorProps {
  selectedCostingModel: 'standard' | 'fifo' | 'bio';
  setSelectedCostingModel: (model: 'standard' | 'fifo' | 'bio') => void;
}

export const CostingSimulator: React.FC<CostingSimulatorProps> = ({
  selectedCostingModel,
  setSelectedCostingModel,
}) => {
  return (
    <section
      id="costing"
      className="py-24 px-6 max-w-7xl mx-auto relative overflow-hidden"
    >
      {/* Background radial glow */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-stretch relative z-10">
        {/* Left Side: Text and Buttons */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--accent-muted) border border-(--accent)/20 text-(--accent) text-xs font-semibold tracking-wide uppercase">
              <Cpu className="w-3.5 h-3.5" /> Dynamic Accounting Simulator
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Double-Entry Cost Allocation
            </h2>

            <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
              Costing is the heart of agricultural efficiency. NAVFarm
              dynamically posts inventory transactions to the General Ledger
              based on the costing model assigned to the production batch.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Standard Costing Selector */}
            <button
              onClick={() => setSelectedCostingModel('standard')}
              className={`group p-5 rounded-[var(--radius-lg)] border text-left cursor-pointer transition-all duration-350 flex gap-4 items-start ${
                selectedCostingModel === 'standard'
                  ? 'bg-[var(--surface)] border-l-4 border-l-(--accent) border-[var(--border)] shadow-[var(--shadow-md)] scale-[1.01]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-(--accent)/30 hover:bg-[var(--surface-raised)]'
              }`}
            >
              <div
                className={`p-3 rounded-[var(--radius-md)] shrink-0 ${
                  selectedCostingModel === 'standard'
                    ? 'bg-(--accent) text-white'
                    : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}
              >
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base block text-[var(--text-primary)] mb-1">
                  A. Standard Costing
                </span>
                <span className="text-xs text-[var(--text-muted)] leading-relaxed block">
                  Locks pricing pre-batch. Flipped usage, price, output, and
                  overhead variances post at close to force WIP balance to zero.
                </span>
              </div>
            </button>

            {/* FIFO Selector */}
            <button
              onClick={() => setSelectedCostingModel('fifo')}
              className={`group p-5 rounded-[var(--radius-lg)] border text-left cursor-pointer transition-all duration-350 flex gap-4 items-start ${
                selectedCostingModel === 'fifo'
                  ? 'bg-[var(--surface)] border-l-4 border-l-(--accent) border-[var(--border)] shadow-[var(--shadow-md)] scale-[1.01]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-(--accent)/30 hover:bg-[var(--surface-raised)]'
              }`}
            >
              <div
                className={`p-3 rounded-[var(--radius-md)] shrink-0 ${
                  selectedCostingModel === 'fifo'
                    ? 'bg-(--accent) text-white'
                    : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}
              >
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base block text-[var(--text-primary)] mb-1">
                  B. FIFO Cost Layers
                </span>
                <span className="text-xs text-[var(--text-muted)] leading-relaxed block">
                  Draws chronologically from lots inside lot_serial_master. No
                  variance postings; cost scales dynamically.
                </span>
              </div>
            </button>

            {/* Bio Assets Selector */}
            <button
              onClick={() => setSelectedCostingModel('bio')}
              className={`group p-5 rounded-[var(--radius-lg)] border text-left cursor-pointer transition-all duration-350 flex gap-4 items-start ${
                selectedCostingModel === 'bio'
                  ? 'bg-[var(--surface)] border-l-4 border-l-(--accent) border-[var(--border)] shadow-[var(--shadow-md)] scale-[1.01]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-(--accent)/30 hover:bg-[var(--surface-raised)]'
              }`}
            >
              <div
                className={`p-3 rounded-[var(--radius-md)] shrink-0 ${
                  selectedCostingModel === 'bio'
                    ? 'bg-(--accent) text-white'
                    : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}
              >
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base block text-[var(--text-primary)] mb-1">
                  C. Biological Assets (IAS 41)
                </span>
                <span className="text-xs text-[var(--text-muted)] leading-relaxed block">
                  Capitalizes feed/maintenance costs into Non-Current Asset
                  (NCA) accounts. Reclassifies on maturity and triggers
                  amortization.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Ledger Presentation */}
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 lg:p-8 flex flex-col justify-between shadow-lg overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider block">
                    NAV_LEDGER_POSTING_SIM
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Active Model Schema
                  </span>
                </div>
              </div>
              <span className="bg-(--accent-muted) text-(--accent) border border-(--accent)/20 px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider">
                AUTO_POST: LIVE
              </span>
            </div>

            {/* Standard Costing Template */}
            {selectedCostingModel === 'standard' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-(--accent) flex items-center justify-between font-mono text-xs font-bold bg-(--accent-muted) p-3 rounded-[var(--radius-sm)] border border-(--accent)/10">
                  <span>
                    // STANDARD COSTING: Batch CLOSE Variance Postings
                  </span>
                  <span className="bg-(--accent-muted) px-2 py-0.5 rounded text-xs">
                    WIP TARGET = 0.00
                  </span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden font-mono text-xs bg-[var(--bg)] min-w-[500px]">
                    <div className="grid grid-cols-12 gap-2 bg-[var(--surface-raised)] border-b border-[var(--border)] p-4 font-bold text-[var(--text-muted)] text-xs uppercase">
                      <span className="col-span-6">GL Account Details</span>
                      <span className="col-span-3 text-right">Debit (Dr)</span>
                      <span className="col-span-3 text-right">Credit (Cr)</span>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6 font-bold text-[var(--text-primary)]">
                          1110 Bird Inventory (DOC Output)
                        </span>
                        <span className="col-span-3 text-right text-emerald-500 font-bold">
                          Rs. 1,78,500
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6">
                          1190 Work-in-Progress (WIP)
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                        <span className="col-span-3 text-right text-rose-500 font-bold">
                          Rs. 1,78,500
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center bg-yellow-500/5">
                        <span className="col-span-6 text-yellow-600 font-semibold flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" /> 6120 Usage
                          Variance (Excess Feed)
                        </span>
                        <span className="col-span-3 text-right text-emerald-500 font-bold">
                          Rs. 43,200
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center bg-yellow-500/5">
                        <span className="col-span-6 text-yellow-600 font-semibold flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" /> 6140 Output
                          Variance (Mortality)
                        </span>
                        <span className="col-span-3 text-right text-emerald-500 font-bold">
                          Rs. 2,975
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6">
                          1190 Work-in-Progress (Settlement)
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                        <span className="col-span-3 text-right text-rose-500 font-bold">
                          Rs. 46,175
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                  *Standard costing locks the rate at batch initiation. Usage
                  deviations are tracked daily but settled atomically to General
                  Ledger on batch CLOSE to zero out WIP.
                </p>
              </div>
            )}

            {/* FIFO Template */}
            {selectedCostingModel === 'fifo' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-blue-500 flex items-center justify-between font-mono text-xs font-bold bg-blue-500/5 p-3 rounded-[var(--radius-sm)] border border-blue-500/10">
                  <span>
                    // FIFO LAYER DRAWDOWN: lot_serial_master depletion
                  </span>
                  <span className="bg-blue-500/10 px-2 py-0.5 rounded text-xs">
                    Layer Auto-Switch
                  </span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden font-mono text-xs bg-[var(--bg)] min-w-[500px]">
                    <div className="bg-[var(--surface-raised)] border-b border-[var(--border)] p-4 font-bold text-[var(--text-muted)] text-xs uppercase">
                      Active Cost Layers in lot_serial_master:
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      <div className="flex items-center justify-between p-4 text-[var(--text-secondary)] opacity-60">
                        <span>Layer 1: 30k DOC Feed @ Rs.3.20 (Jan 5)</span>
                        <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-xs font-bold">
                          DEPLETED (CLOSED)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 text-[var(--text-secondary)] bg-blue-500/5">
                        <span className="font-bold text-[var(--text-primary)]">
                          Layer 2: 20k DOC Feed @ Rs.4.50 (Jan 15)
                        </span>
                        <span className="bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                          12k KG OPEN
                        </span>
                      </div>
                    </div>

                    <div className="bg-[var(--surface-raised)] border-t border-b border-[var(--border)] p-4 font-bold text-[var(--text-muted)] text-xs uppercase">
                      Generated Double-Entry Drawdown:
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6 font-bold text-[var(--text-primary)]">
                          Dr 1190 WIP (Layer 2 consumption)
                        </span>
                        <span className="col-span-3 text-right text-emerald-500 font-bold">
                          Rs. 24,900
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6">
                          Cr 1100 Feed Inventory (Depleted)
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                        <span className="col-span-3 text-right text-rose-500 font-bold">
                          Rs. 24,900
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                  *FIFO tracks historical purchase invoices in lots. Consumption
                  draws sequentially from older layers; the true chronological
                  costs represent the final batch value. No variance entries
                  needed.
                </p>
              </div>
            )}

            {/* Biological Assets Template */}
            {selectedCostingModel === 'bio' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-emerald-500 flex items-center justify-between font-mono text-xs font-bold bg-emerald-500/5 p-3 rounded-[var(--radius-sm)] border border-emerald-500/10">
                  <span>// BIOLOGICAL ASSETS: IAS 41 Stage Capitalization</span>
                  <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                    NCA Capitalize
                  </span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden font-mono text-xs bg-[var(--bg)] min-w-[500px]">
                    <div className="bg-[var(--surface-raised)] border-b border-[var(--border)] p-4 font-bold text-[var(--text-muted)] text-xs uppercase">
                      Stage 1: Nurturing Capitalization (Premature Month 1-24)
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6 font-bold text-[var(--text-primary)]">
                          Dr 1220 Non-Current Asset (Cattle)
                        </span>
                        <span className="col-span-3 text-right text-emerald-500 font-bold">
                          Rs. 7,200
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6">
                          Cr 1100 Feed Inventory (Expensed to Asset)
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                        <span className="col-span-3 text-right text-rose-500 font-bold">
                          Rs. 7,200
                        </span>
                      </div>
                    </div>

                    <div className="bg-[var(--surface-raised)] border-t border-b border-[var(--border)] p-4 font-bold text-[var(--text-muted)] text-xs uppercase">
                      Stage 2: Mature Stage Amortization (Month 25 onward)
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6 font-bold text-[var(--text-primary)]">
                          Dr 7100 Amortization Expense (P&L)
                        </span>
                        <span className="col-span-3 text-right text-emerald-500 font-bold">
                          Rs. 2,099
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 p-4 text-[var(--text-secondary)] items-center">
                        <span className="col-span-6">
                          Cr 1221 Accumulated Amortization (NCA)
                        </span>
                        <span className="col-span-3 text-right text-[var(--text-muted)]">
                          -
                        </span>
                        <span className="col-span-3 text-right text-rose-500 font-bold">
                          Rs. 2,099
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                  *All costs incurred during premature stage increase the book
                  value of the biological asset. Upon maturity, the asset value
                  is amortized monthly over its productive lifetime.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
export default CostingSimulator;
