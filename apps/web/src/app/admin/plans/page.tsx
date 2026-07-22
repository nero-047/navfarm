"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle, CheckCircle, Plus, Edit2, X } from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredToken, getStoredUser } from "../../../hooks/useAuth";
import { Dialog } from "../../../components/ui/dialog";

const s = {
  input: { borderColor: "var(--input-border)", backgroundColor: "var(--input-bg)", color: "var(--input-text)" },
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised: { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  text: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
  border: { borderColor: "var(--border)" },
  accent: { color: "var(--accent)" },
};

const emptyPlan = {
  plan_id: "", plan_name: "", price: "0.00", billing_cycle: "MONTHLY",
  max_companies: 1, max_users: 5, storage_limit_gb: "5.00",
  feature_flags: { qr_traceability: false, api_access: false } as Record<string, boolean>,
};

export default function AdminPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyPlan });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user || user.userType !== "SYSTEM_ADMIN") { router.replace("/"); return; }
    loadPlans();
  }, [router]);

  const loadPlans = async () => {
    setLoading(true);
    try { const list = await api.get("/plan"); setPlans(list); }
    catch (e: any) { setError(e?.message || "Failed to load plans."); }
    finally { setLoading(false); }
  };

  const handleOpen = (plan?: any) => {
    setEditingPlan(plan || null);
    if (plan) {
      // Normalize feature_flags from API response (may be nested object or flat booleans)
      const ff = plan.feature_flags || {};
      setForm({
        plan_id:          plan.plan_id         || "",
        plan_name:        plan.plan_name        || "",
        price:            plan.price            ?? "0.00",
        billing_cycle:    plan.billing_cycle    || "MONTHLY",
        max_companies:    plan.max_companies    ?? 1,
        max_users:        plan.max_users        ?? 5,
        storage_limit_gb: plan.storage_limit_gb ?? "5.00",
        feature_flags: {
          qr_traceability: !!(ff.qr_traceability),
          api_access:      !!(ff.api_access),
        },
      });
    } else {
      setForm({ ...emptyPlan, feature_flags: { qr_traceability: false, api_access: false } });
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      // Build a clean payload that matches CreatePlanDto / UpdatePlanDto exactly.
      // Never send plan_id, created_at, updated_at or other DB-managed columns to PUT.
      const payload = {
        plan_name:        form.plan_name,
        price:            form.price,
        billing_cycle:    form.billing_cycle,
        max_companies:    form.max_companies,
        max_users:        form.max_users,
        storage_limit_gb: form.storage_limit_gb,
        feature_flags:    form.feature_flags,
      };
      if (editingPlan) {
        await api.put(`/plan/${editingPlan.plan_id}`, payload);
        setSuccess("Plan updated.");
      } else {
        // CREATE — include user-defined plan_id
        await api.post("/plan", { plan_id: form.plan_id, ...payload });
        setSuccess("Plan created.");
      }

      setShowForm(false); setEditingPlan(null);
      await loadPlans();
    } catch (err: any) { setError(err?.message || "Failed to save plan."); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin w-5 h-5 mr-2" style={s.accent} />
        <span className="text-sm" style={s.sub}>Loading plans…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={s.text}>Subscription Plans</h1>
          <p className="text-sm mt-0.5" style={s.sub}>{plans.length} plans configured</p>
        </div>
        <button onClick={() => handleOpen()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors"
          style={{ backgroundColor: "var(--accent)" }}>
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 text-sm"><CheckCircle className="w-4 h-4 shrink-0" /> {success}</div>}

      {/* Form */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} title={editingPlan ? "Edit subscription plan" : "Create subscription plan"} description="Set billing, capacity, and feature availability." maxWidth="lg">
          <form onSubmit={handleSave} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "plan_id", label: "Plan ID", placeholder: "PLAN_BASIC", disabled: !!editingPlan },
              { key: "plan_name", label: "Plan Name", placeholder: "Basic Starter" },
              { key: "price", label: "Price (USD)", placeholder: "49.00" },
            ].map(({ key, label, placeholder, disabled }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={s.sub}>{label}</label>
                <input required value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} disabled={disabled}
                  className={inputCls} style={{ ...s.input, opacity: disabled ? 0.6 : 1 }} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={s.sub}>Billing Cycle</label>
              <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                className={inputCls} style={s.input}>
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={s.sub}>Max Companies</label>
              <input type="number" min={1} value={form.max_companies}
                onChange={(e) => setForm({ ...form, max_companies: +e.target.value })}
                className={inputCls} style={s.input} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={s.sub}>Max Users</label>
              <input type="number" min={1} value={form.max_users}
                onChange={(e) => setForm({ ...form, max_users: +e.target.value })}
                className={inputCls} style={s.input} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={s.sub}>Storage (GB)</label>
              <input value={form.storage_limit_gb} onChange={(e) => setForm({ ...form, storage_limit_gb: e.target.value })}
                className={inputCls} style={s.input} />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={s.text}>
                <input type="checkbox" checked={!!form.feature_flags?.qr_traceability}
                  onChange={(e) => setForm({ ...form, feature_flags: { ...form.feature_flags, qr_traceability: e.target.checked } })}
                  className="w-4 h-4 rounded" />
                QR Traceability
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={s.text}>
                <input type="checkbox" checked={!!form.feature_flags?.api_access}
                  onChange={(e) => setForm({ ...form, feature_flags: { ...form.feature_flags, api_access: e.target.checked } })}
                  className="w-4 h-4 rounded" />
                API Access
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#edf0f4] pt-5 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3">
              <button type="submit" disabled={saving}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1248] px-5 text-sm font-semibold text-white hover:bg-[#151d5e] disabled:opacity-50">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {saving ? "Saving…" : editingPlan ? "Save Changes" : "Create Plan"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="h-11 rounded-xl border border-[#e3e7ee] bg-white px-5 text-sm font-medium text-[#515463] hover:bg-[#f7f8fa]">
                Cancel
              </button>
            </div>
          </form>
      </Dialog>

      {/* Plans Table */}
      <div className="rounded-lg border overflow-hidden shadow-sm" style={s.surface}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={s.raised}>
              {["Plan ID", "Name", "Price", "Cycle", "Cos.", "Users", "QR", "API", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider" style={s.muted}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-sm" style={s.muted}>No plans configured yet.</td></tr>
            )}
            {plans.map((plan) => (
              <tr key={plan.plan_id} className="border-b transition-colors" style={s.border}>
                <td className="px-4 py-3 font-mono text-xs" style={s.muted}>{plan.plan_id}</td>
                <td className="px-4 py-3 font-semibold" style={s.text}>{plan.plan_name}</td>
                <td className="px-4 py-3" style={s.sub}>${plan.price}</td>
                <td className="px-4 py-3">
                  <span className="text-[11px] px-2 py-0.5 rounded font-medium"
                    style={{ backgroundColor: "var(--surface-raised)", color: "var(--text-secondary)" }}>{plan.billing_cycle}</span>
                </td>
                <td className="px-4 py-3 text-center font-semibold" style={s.text}>{plan.max_companies}</td>
                <td className="px-4 py-3 text-center font-semibold" style={s.text}>{plan.max_users}</td>
                <td className="px-4 py-3 text-center">{plan.feature_flags?.qr_traceability ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 mx-auto" style={s.muted} />}</td>
                <td className="px-4 py-3 text-center">{plan.feature_flags?.api_access ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 mx-auto" style={s.muted} />}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleOpen(plan)} className="text-xs font-medium flex items-center gap-1" style={s.accent}>
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
