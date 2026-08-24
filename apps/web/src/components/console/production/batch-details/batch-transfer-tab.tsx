"use client";

import React, { useMemo } from "react";
import { ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchTransferTabProps {
  batch: any;
  onTransferStage?: () => void;
}

export function BatchTransferTab({ batch, onTransferStage }: BatchTransferTabProps) {
  const stageLogs = useMemo(() => {
    return batch?.stage_log || batch?.stage_logs || [];
  }, [batch]);

  const currentQty = Math.round(Number(batch?.current_quantity ?? batch?.opening_quantity ?? 30));
  const stageName = batch?.current_stage_code
    ? batch.current_stage_code.replace(/_/g, " ")
    : batch?.stage_name || batch?.stage || "ACTIVE";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Main Transfer & Stage Movement Log ── */}
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Stage Lifecycle & Pen Transfer Log — {stageName}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Append-only audit trail of batch stage transitions, pen relocations, and animal transfers
              </p>
            </div>
            {onTransferStage && (
              <Button
                onClick={onTransferStage}
                className="bg-[#1A3A5C] text-white text-xs h-8 px-3 gap-1.5 font-bold shadow-xs self-start sm:self-center"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Stage
              </Button>
            )}
          </div>

          {/* Table */}
          {stageLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-xl mx-auto text-[var(--text-muted)]">
                <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
              </div>
              <h4 className="text-xs font-black text-[var(--text-primary)]">Initial Stage in Progress</h4>
              <p className="text-[11px] text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                Batch {batch.batch_no} is currently executing stage <strong>{stageName}</strong>. Use "Transfer Stage" when ready to advance to the next lifecycle phase.
              </p>
              {onTransferStage && (
                <Button onClick={onTransferStage} variant="outline" className="text-xs h-8 px-3 gap-1.5 font-bold">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Advance to Next Stage
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[650px]">
                <thead className="bg-[var(--surface-raised)]/50 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3">Transition Date</th>
                    <th className="px-3.5 py-3">From Stage</th>
                    <th className="px-3.5 py-3">To Stage</th>
                    <th className="px-3.5 py-3 text-right">Headcount</th>
                    <th className="px-4 py-3">Remarks / Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {stageLogs.map((log: any, idx: number) => (
                    <tr key={log.log_id || idx} className="hover:bg-[var(--surface-raised)]/30 transition">
                      <td className="px-4 py-3 font-bold text-[var(--text-primary)] whitespace-nowrap">
                        {log.transition_date || log.transferred_at?.slice(0, 10) || log.created_at?.slice(0, 10) || "2026-08-21"}
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[var(--text-secondary)]">
                        {log.from_stage_code ? log.from_stage_code.replace(/_/g, " ") : "INITIAL ENTRY"}
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {log.to_stage_code ? log.to_stage_code.replace(/_/g, " ") : stageName}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-black text-[var(--text-primary)]">
                        {log.head_count || currentQty} head
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {log.remarks || "Batch advanced to subsequent lifecycle phase"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-raised)]/20 flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>{stageLogs.length} stage progression logs recorded</span>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar: Transfer Policy ── */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
              Stage Movement Policy
            </h3>
          </div>

          <div className="divide-y divide-[var(--border)] text-xs">
            <div className="flex items-center justify-between p-3.5">
              <span className="text-[var(--text-secondary)]">Active Phase</span>
              <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase font-mono">
                {stageName}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5">
              <span className="text-[var(--text-secondary)]">Current Headcount</span>
              <span className="font-bold text-[var(--text-primary)] font-mono">{currentQty} head</span>
            </div>
            <div className="flex items-center justify-between p-3.5">
              <span className="text-[var(--text-secondary)]">Cost Accumulation Rule</span>
              <span className="font-bold text-[var(--text-primary)]">Roll-over WIP to Next Stage</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/40 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Automatic Stage Scheduler Switch</span>
          </div>
          <p className="text-indigo-800 dark:text-indigo-300 text-[11px] leading-relaxed">
            When you transfer this batch to a new stage, NavFarm automatically switches the daily feed, health, and standard curves to the matching scheduler.
          </p>
        </div>
      </div>
    </div>
  );
}
