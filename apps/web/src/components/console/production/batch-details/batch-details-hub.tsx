"use client";

import React, { useState, useEffect } from "react";
import { BatchHeader } from "./batch-header";
import { BatchDataEntryTab } from "./batch-data-entry-tab";
import { BatchStageSchedulersTab } from "./batch-stage-schedulers-tab";
import { BatchOverviewTab } from "./batch-overview-tab";
import { BatchAnimalAssignmentTab } from "./batch-animal-assignment-tab";
import { BatchLocationsTab } from "./batch-locations-tab";
import { BatchConsumptionTab } from "./batch-consumption-tab";
import { BatchMortalityTab } from "./batch-mortality-tab";
import { BatchTransferTab } from "./batch-transfer-tab";
import { BatchOutputTab } from "./batch-output-tab";
import { BatchDocumentsTab } from "./batch-documents-tab";
import BatchPerformanceCurvesPanel from "@/components/console/production/batch-performance-curves-panel";
import { CheckCheck, Inbox } from "lucide-react";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { api } from "@/services/api-client";

interface BatchDetailsHubProps {
  batch: any;
  items: any[];
  batches: any[];
  onRefreshBatch: () => Promise<void>;
  onTransferStage: () => void;
  onMatureBio: () => void;
  onAmortizeBio: () => void;
  onFairValueBio: () => void;
  onDisposeBio: () => void;
  onCloseBatch: () => void;
  onActivateBatch: () => void;
  onRecordQc: (line: any) => void;
  onGeneratePack: (line: any) => void;
  onRenewBatch?: () => void;
  initialTab?: string;
}

export function BatchDetailsHub({
  batch,
  items,
  batches,
  onRefreshBatch,
  onTransferStage,
  onMatureBio,
  onAmortizeBio,
  onFairValueBio,
  onDisposeBio,
  onCloseBatch,
  onActivateBatch,
  onRecordQc,
  onGeneratePack,
  onRenewBatch: _onRenewBatch,
  initialTab,
}: BatchDetailsHubProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab || "overview");
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dataEntryData, setDataEntryData] = useState<any>(null);
  const [dataEntryLoading, setDataEntryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDataEntry = async (date: string) => {
    if (!batch?.batch_id) return;
    setDataEntryLoading(true);
    try {
      const res = await api.get(`/batch/${batch.batch_id}/data-entry?date=${date}`);
      const data = res?.data ?? res;
      setDataEntryData(data);
    } catch {
      setDataEntryData(null);
    } finally {
      setDataEntryLoading(false);
    }
  };

  useEffect(() => {
    loadDataEntry(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.batch_id, currentDate]);

  // Handle Save Entry from the Data Entry Tab
  const handleSaveEntry = async (payload: any) => {
    setSaving(true);
    try {
      await api.post(`/batch/${batch.batch_id}/daily-entry`, {
        date: currentDate,
        ...payload,
      });

      await onRefreshBatch();
      await loadDataEntry(currentDate);
    } catch (err: any) {
      console.error("Daily entry post failed:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Batch Context Header & Stage Lifecycle Bar ── */}
      <BatchHeader
        batch={batch}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={() => handleSaveEntry({})}
        saving={saving}
        onTransferStage={onTransferStage}
        onMatureBio={onMatureBio}
        onAmortizeBio={onAmortizeBio}
        onFairValueBio={onFairValueBio}
        onDisposeBio={onDisposeBio}
        onCloseBatch={onCloseBatch}
        onActivateBatch={onActivateBatch}
      />

      {/* ── Active Tab Content ── */}
      {activeTab === "data-entry" && (
        <BatchDataEntryTab
          batch={batch}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          items={items}
          batches={batches}
          dataEntryData={dataEntryData}
          dataEntryLoading={dataEntryLoading}
          onSaveEntry={handleSaveEntry}
          onRefreshBatch={onRefreshBatch}
          saving={saving}
        />
      )}

      {activeTab === "overview" && <BatchOverviewTab batch={batch} onTabChange={setActiveTab} />}

      {activeTab === "stage-schedulers" && (
        <BatchStageSchedulersTab
          batch={batch}
          onRefreshBatch={onRefreshBatch}
          onTransferStage={onTransferStage}
        />
      )}

      {activeTab === "locations" && (
        <BatchLocationsTab batch={batch} onRefreshBatch={onRefreshBatch} />
      )}

      {activeTab === "animal-assignment" && (
        <BatchAnimalAssignmentTab batch={batch} onRefreshBatch={onRefreshBatch} />
      )}

      {activeTab === "consumption" && (
        <BatchConsumptionTab batch={batch} items={items} onRefreshBatch={onRefreshBatch} />
      )}

      {activeTab === "mortality" && (
        <BatchMortalityTab batch={batch} onRefreshBatch={onRefreshBatch} />
      )}

      {activeTab === "transfer" && (
        <BatchTransferTab batch={batch} onTransferStage={onTransferStage} />
      )}

      {activeTab === "output" && (
        <BatchOutputTab
          batch={batch}
          items={items}
          onRefreshBatch={onRefreshBatch}
          onRecordQc={onRecordQc}
          onGeneratePack={onGeneratePack}
        />
      )}

      {activeTab === "documents" && <BatchDocumentsTab batch={batch} onRefreshBatch={onRefreshBatch} />}

      {activeTab === "curves" && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <BatchPerformanceCurvesPanel
            batchId={batch.batch_id}
            onSchedulerGenerated={onRefreshBatch}
          />
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-primary)]">Batch KPI Deviation Log</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Historical threshold deviations logged against attached scheduler.
              </p>
            </div>
            {(batch.alerts || []).some((a: any) => !a.is_read) && (
              <button
                onClick={async () => {
                  try {
                    await api.post("/alert/mark-all-read", { batchId: batch.batch_id });
                    await onRefreshBatch();
                  } catch {}
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface-raised)]"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Mark All Read
              </button>
            )}
          </div>

          {(batch.alerts || []).length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              <Inbox className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No KPI deviation alerts logged for this batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <TableHeader>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                    <TableHead className="px-3 py-2">Severity</TableHead>
                    <TableHead className="px-3 py-2">Alert / Deviation</TableHead>
                    <TableHead className="px-3 py-2">Expected</TableHead>
                    <TableHead className="px-3 py-2">Actual</TableHead>
                    <TableHead className="px-3 py-2">Logged At</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {(batch.alerts || []).map((alert: any) => (
                    <TableRow key={alert.alert_id} style={{ opacity: alert.is_read ? 0.6 : 1 }}>
                      <TableCell className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alert.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : alert.severity === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 font-semibold text-[var(--text-primary)]">
                        {alert.alert_title || alert.message}
                      </TableCell>
                      <TableCell className="px-3 py-2 font-mono">{alert.expected_value ?? "—"}</TableCell>
                      <TableCell className="px-3 py-2 font-mono">{alert.actual_value ?? "—"}</TableCell>
                      <TableCell className="px-3 py-2 text-[var(--text-secondary)]">{alert.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
