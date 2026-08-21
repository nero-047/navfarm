"use client";

import { useEffect, useState } from "react";
import {
  Loader2, RefreshCw, Building2, AlertTriangle, ShieldCheck,
  ShieldAlert, CheckCircle2, Users,
} from "lucide-react";

import { api } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";
import { getActiveCompanyId } from "@/hooks/useAuth";

type Row = Record<string, any>;

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised:  { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub:     { color: "var(--text-secondary)" },
  muted:   { color: "var(--text-muted)" },
  accent:  { color: "var(--accent)" },
  danger:  { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--danger-muted)" },
  warning: { color: "var(--warning)", borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)" },
  success: { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--success-muted)" },
};

export default function FacilityOccupancyPanel() {
  const companyId = getActiveCompanyId();

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [locations, setLocations] = useState<Row[]>([]);

  const loadOccupancy = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/location/occupancy?companyId=${companyId}`);
      setLocations(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load facility occupancy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOccupancy();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCapacity = locations.reduce((sum, l) => sum + (l.max_capacity || 0), 0);
  const totalOccupied = locations.reduce((sum, l) => sum + (l.current_occupancy || 0), 0);
  const totalQuarantinePens = locations.filter((l) => l.biosecurity_status === "QUARANTINE_ACTIVE").length;
  const totalOverCapacity = locations.filter((l) => l.is_over_capacity).length;

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between rounded-[var(--radius-lg)] border p-4" style={S.surface}>
        <div>
          <h3 className="text-base font-semibold" style={S.primary}>Facility & Pen Live Occupancy Tracker</h3>
          <p className="text-xs" style={S.muted}>Real-time pen headcount, utilization gauges, and biosecurity isolation tracking</p>
        </div>
        <Button size="sm" onClick={loadOccupancy} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
          Refresh Occupancy
        </Button>
      </div>

      {error && <InlineAlert variant="danger">{error}</InlineAlert>}

      {/* ── Top Executive KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Total Capacity</p>
            <Building2 className="h-4 w-4" style={{ color: "var(--accent)" }} />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono" style={S.primary}>
            {totalCapacity > 0 ? totalCapacity.toLocaleString("en-IN") : "—"}{" "}
            <span className="text-xs font-normal" style={S.muted}>head</span>
          </p>
          <p className="mt-1 text-[11px]" style={S.sub}>{locations.length} configured locations/pens</p>
        </div>

        <div className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Current Occupancy</p>
            <Users className="h-4 w-4" style={{ color: "var(--accent)" }} />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono" style={S.primary}>
            {totalOccupied.toLocaleString("en-IN")}{" "}
            <span className="text-xs font-normal" style={S.muted}>head</span>
          </p>
          <p className="mt-1 text-[11px]" style={S.sub}>
            {totalCapacity > 0 ? `${Math.round((totalOccupied / totalCapacity) * 100)}% overall utilization` : "Headcount active"}
          </p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={totalQuarantinePens > 0 ? S.warning : { backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider">Biosecurity Alert</p>
            {totalQuarantinePens > 0 ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" style={{ color: "var(--accent)" }} />}
          </div>
          <p className="mt-2 text-2xl font-bold font-mono">
            {totalQuarantinePens}{" "}
            <span className="text-xs font-normal">pens</span>
          </p>
          <p className="mt-1 text-[11px]">
            {totalQuarantinePens > 0 ? "Active quarantine/sick isolation" : "All pens operating normally"}
          </p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={totalOverCapacity > 0 ? S.danger : { backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider">Over-Capacity Pens</p>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono">
            {totalOverCapacity}{" "}
            <span className="text-xs font-normal">pens</span>
          </p>
          <p className="mt-1 text-[11px]">
            {totalOverCapacity > 0 ? "Requires pen rebalancing" : "Optimal animal density"}
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" style={S.accent} />
          <p className="mt-3 text-sm" style={S.sub}>Loading facility occupancy metrics…</p>
        </div>
      )}

      {/* ── Grid of Location / Pen Cards ── */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => {
            const isQuarantine = loc.biosecurity_status === "QUARANTINE_ACTIVE";
            const isOver = loc.is_over_capacity;
            const pct = loc.utilization_pct || 0;

            return (
              <div
                key={loc.location_id}
                className="rounded-[var(--radius-lg)] border p-4 shadow-sm transition-all"
                style={isOver ? S.danger : isQuarantine ? S.warning : S.surface}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono text-sm" style={S.primary}>
                        {loc.location_code}
                      </span>
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase" style={S.surface}>
                        {loc.location_type || "PEN"}
                      </span>
                    </div>
                    <p className="text-xs font-medium mt-1" style={S.primary}>
                      {loc.location_name}
                    </p>
                    <p className="text-[11px]" style={S.muted}>
                      Under {loc.parent_name}
                    </p>
                  </div>

                  {isQuarantine ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase rounded border px-2 py-0.5" style={S.warning}>
                      <ShieldAlert className="h-3 w-3" /> Sick: {loc.sick_animal_count}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase rounded border px-2 py-0.5" style={S.surface}>
                      <CheckCircle2 className="h-3 w-3" style={S.accent} /> Clean
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span style={S.sub}>Occupancy</span>
                    <span className="font-mono font-bold" style={S.primary}>
                      {loc.current_occupancy} / {loc.max_capacity != null ? `${loc.max_capacity} ${loc.capacity_uom}` : "∞"}
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full overflow-hidden" style={S.raised}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: isOver ? "var(--danger)" : pct >= 90 ? "var(--warning)" : "var(--accent)",
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px]" style={S.muted}>
                    <span>Animals: {loc.animal_count} · Batches: {loc.batch_count}</span>
                    <span>{loc.max_capacity ? `${pct}%` : "No limit set"}</span>
                  </div>

                  {(loc.last_cleaned_date || loc.last_disinfected_date) && (
                    <div className="pt-2 border-t border-slate-800/40 text-[10px] text-slate-400 flex justify-between">
                      <span>Cleaned: {loc.last_cleaned_date || "--"}</span>
                      <span>Disinfected: {loc.last_disinfected_date || "--"}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {locations.length === 0 && (
            <div className="col-span-3 py-12 text-center rounded-[var(--radius-lg)] border" style={S.surface}>
              <p className="text-sm" style={S.sub}>No farm locations or pens configured.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
