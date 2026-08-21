"use client";

import React from "react";
import { Check, Clock } from "lucide-react";

export interface PiggeryStage {
  id: number;
  code: string;
  name: string;
  type: string;
  daysRange: string;
  dateRange?: string;
  status: "COMPLETED" | "CURRENT" | "UPCOMING";
  standardDays: number;
}

export const DEFAULT_PIGGERY_STAGES: PiggeryStage[] = [
  { id: 1, code: "ST-01", name: "Quarantine", type: "Rearing", daysRange: "0 - 7 Days", dateRange: "02-Mar-25 to 08-Mar-25", status: "COMPLETED", standardDays: 7 },
  { id: 2, code: "ST-02", name: "Gilt Grower", type: "Rearing", daysRange: "8 - 120 Days", dateRange: "09-Mar-25 to 05-May-25", status: "COMPLETED", standardDays: 112 },
  { id: 3, code: "ST-03", name: "Flush / AI", type: "Breeding", daysRange: "121 - 128 Days", dateRange: "06-May-25 to 13-May-25", status: "COMPLETED", standardDays: 7 },
  { id: 4, code: "ST-04", name: "Gestation", type: "Production", daysRange: "129 - 242 Days", dateRange: "14-May-25 to 04-Sep-25", status: "CURRENT", standardDays: 114 },
  { id: 5, code: "ST-05", name: "Farrowing", type: "Production", daysRange: "243 - 250 Days", dateRange: "05-Sep-25 to 12-Sep-25", status: "UPCOMING", standardDays: 7 },
  { id: 6, code: "ST-06", name: "Lactation", type: "Production", daysRange: "251 - 278 Days", dateRange: "13-Sep-25 to 10-Oct-25", status: "UPCOMING", standardDays: 28 },
  { id: 7, code: "ST-07", name: "Weaning", type: "Recovery", daysRange: "279 - 285 Days", dateRange: "11-Oct-25 to 17-Oct-25", status: "UPCOMING", standardDays: 6 },
  { id: 8, code: "ST-08", name: "Next Cycle", type: "Recovery", daysRange: "286+ Days", dateRange: "18-Oct-25 onwards", status: "UPCOMING", standardDays: 14 },
];

export default function PiggeryLifecycleStepper({
  stages = DEFAULT_PIGGERY_STAGES,
  currentStageId = 4,
  onSelectStage,
}: {
  stages?: PiggeryStage[];
  currentStageId?: number;
  onSelectStage?: (stage: PiggeryStage) => void;
}) {
  const currentIdx = stages.findIndex((s) => s.id === currentStageId);
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;
  const progressPercent = stages.length > 1 ? (activeIndex / (stages.length - 1)) * 100 : 0;

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 overflow-x-auto shadow-2xs">
      <div className="min-w-[780px] relative">
        {/* Continuous Background Timeline Line */}
        <div className="absolute top-4 left-6 right-6 h-[3px] bg-[var(--border)] z-0 rounded-full" />

        {/* Dynamic Completed/Active Progress Line */}
        <div
          className="absolute top-4 left-6 h-[3px] bg-[var(--success)] z-0 transition-all duration-500 rounded-full"
          style={{ width: `calc(${progressPercent}% * 0.92)` }}
        />

        {/* Stages Grid - strictly top-aligned */}
        <div className="flex items-start justify-between relative z-10">
          {stages.map((stage) => {
            const isCompleted = stage.id < currentStageId;
            const isCurrent = stage.id === currentStageId;

            return (
              <div
                key={stage.id}
                onClick={() => onSelectStage && onSelectStage(stage)}
                className="flex flex-col items-center cursor-pointer group flex-1 max-w-[120px]"
              >
                {/* 1. Circle Indicator (strictly 32px height, top-aligned) */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                    isCompleted
                      ? "bg-[var(--success)] text-white ring-4 ring-[var(--success-muted)] shadow-xs"
                      : isCurrent
                      ? "bg-[var(--accent)] text-white ring-4 ring-[var(--accent-muted)] shadow-md scale-110"
                      : "bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-muted)] group-hover:border-[var(--text-secondary)]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>{stage.id}</span>
                  )}
                </div>

                {/* 2. Text Details below circle */}
                <div className="mt-2.5 text-center flex flex-col items-center w-full">
                  <p
                    className={`text-xs tracking-tight truncate max-w-[110px] ${
                      isCurrent
                        ? "text-[var(--accent)] font-bold"
                        : isCompleted
                        ? "text-[var(--text-primary)] font-semibold"
                        : "text-[var(--text-secondary)] font-medium"
                    }`}
                    title={stage.name}
                  >
                    {stage.name}
                  </p>

                  <p className="text-[10px] text-[var(--text-muted)] font-mono whitespace-nowrap mt-0.5">
                    {stage.daysRange}
                  </p>

                  {/* 3. Status Pill with fixed height to prevent vertical misalignment */}
                  <div className="h-5 mt-1.5 flex items-center justify-center">
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold uppercase tracking-wider shadow-2xs animate-pulse">
                        Current
                      </span>
                    ) : isCompleted ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success)]/20 text-[9px] font-semibold">
                        Done
                      </span>
                    ) : (
                      <span className="text-[9px] text-[var(--text-muted)]">Upcoming</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
