"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

export interface DairyLifecycleStage {
  stageNumber: number;
  stageCode: string;
  stageName: string;
  durationDays: string;
  status: "COMPLETED" | "ACTIVE" | "PENDING";
  description: string;
}

export const DEFAULT_DAIRY_STAGES: DairyLifecycleStage[] = [
  { stageNumber: 1, stageCode: "CALF", stageName: "Calf Rearing", durationDays: "0 - 60 Days", status: "COMPLETED", description: "Colostrum feeding, milk replacer, dehorning & ear-tagging" },
  { stageNumber: 2, stageCode: "WEANED_HEIFER", stageName: "Weaned Heifer", durationDays: "2 - 12 Months", status: "COMPLETED", description: "Forage adaptation, grower concentrate & immunization" },
  { stageNumber: 3, stageCode: "BREEDING_HEIFER", stageName: "Breeding Heifer", durationDays: "12 - 15 Months", status: "COMPLETED", description: "Target 340kg weight, estrus sync & Artificial Insemination (AI)" },
  { stageNumber: 4, stageCode: "PREG_HEIFER", stageName: "Pregnant Heifer", durationDays: "Gestation (280d)", status: "COMPLETED", description: "Fetal development, ultrasound pregnancy confirmation" },
  { stageNumber: 5, stageCode: "TRANSITION", stageName: "Transition / Close-up", durationDays: "21d Pre-calving", status: "COMPLETED", description: "Steam-up feeding, anionic salts, calving pen preparation" },
  { stageNumber: 6, stageCode: "EARLY_LAC", stageName: "Early Lactation (Fresh)", durationDays: "Day 1 - 100", status: "ACTIVE", description: "Peak milk production, negative energy balance & metabolic health" },
  { stageNumber: 7, stageCode: "MID_LAC", stageName: "Mid Lactation", durationDays: "Day 101 - 200", status: "PENDING", description: "Yield persistency, re-breeding AI window, body score maintenance" },
  { stageNumber: 8, stageCode: "LATE_LAC", stageName: "Late Lactation", durationDays: "Day 201 - 305", status: "PENDING", description: "Tapering lactation, pregnant cow care & drying-off preparation" },
  { stageNumber: 9, stageCode: "DRY_PERIOD", stageName: "Dry Cow Period", durationDays: "60 Days", status: "PENDING", description: "Mammary gland rest, dry therapy infusion & pre-calving prep" },
];

interface DairyLifecycleStepperProps {
  currentStageCode?: string;
  onSelectStage?: (stageCode: string) => void;
}

export default function DairyLifecycleStepper({
  currentStageCode = "EARLY_LAC",
  onSelectStage,
}: DairyLifecycleStepperProps) {
  return (
    <div
      className="w-full rounded-[var(--radius-lg)] border p-4 sm:p-5 text-[var(--text-primary)]"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold">
            Dairy Herd Production Lifecycle (9 Standard Stages)
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Standard biological lifecycle from calf rearing through peak lactation and 60-day dry period.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-black/20 dark:bg-white/20" /> Upcoming
          </span>
        </div>
      </div>

      {/* ── Stepper Track ── */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-[920px] justify-between relative">
          {DEFAULT_DAIRY_STAGES.map((stage, idx) => {
            const isCompleted = stage.status === "COMPLETED";
            const isActive = stage.stageCode === currentStageCode || stage.status === "ACTIVE";

            return (
              <div
                key={stage.stageCode}
                onClick={() => onSelectStage && onSelectStage(stage.stageCode)}
                className={`group flex flex-1 flex-col items-center text-center px-1 cursor-pointer transition-all ${
                  isActive ? "scale-105" : "opacity-80 hover:opacity-100"
                }`}
              >
                {/* Step Circle & Connector */}
                <div className="relative flex items-center justify-center w-full">
                  {idx > 0 && (
                    <div
                      className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-[2px] -z-10 ${
                        isCompleted || isActive ? "bg-emerald-500" : "bg-black/10 dark:bg-white/10"
                      }`}
                    />
                  )}
                  {idx < DEFAULT_DAIRY_STAGES.length - 1 && (
                    <div
                      className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-[2px] -z-10 ${
                        isCompleted ? "bg-emerald-500" : "bg-black/10 dark:bg-white/10"
                      }`}
                    />
                  )}

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-[var(--accent)] text-white ring-4 ring-[var(--accent)]/20"
                        : "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      stage.stageNumber
                    )}
                  </div>
                </div>

                {/* Stage Meta */}
                <div className="mt-2.5 space-y-0.5">
                  <p
                    className={`text-[12px] font-semibold tracking-tight leading-tight ${
                      isActive ? "text-[var(--accent)] font-bold" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {stage.stageName}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {stage.durationDays}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
