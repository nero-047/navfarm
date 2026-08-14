"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { Bell, RefreshCw, AlertCircle, CheckCircle, Save, Send, Mail, Globe, Eye, EyeOff } from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredToken, getStoredUser, getStoredTenantId, type NavUser } from "../../../hooks/useAuth";
import { Dialog } from "../../../components/ui/dialog";

const inputCls = "nf-input";
const inputStyle = {
  borderColor: "var(--input-border)",
  backgroundColor: "var(--input-bg)",
  color: "var(--input-text)",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeChannel, setActiveChannel] = useState<"EMAIL" | "WEBHOOK">("EMAIL");

  const [emailForm, setEmailForm] = useState({
    smtp_host: "", smtp_port: 587, smtp_user: "", smtp_password_enc: "",
    from_email: "", from_name: "NAVFarm Alerts",
  });
  const [webhookForm, setWebhookForm] = useState({ webhook_url: "", webhook_secret_enc: "" });
  const [testRecipient, setTestRecipient] = useState("");
  const [testMessage, setTestMessage] = useState("This is a live test notification from your NAVFarm workspace.");

  const [configs, setConfigs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const tid = getStoredTenantId();
    if (!token || !storedUser || !tid) { router.replace("/"); return; }
    loadData(storedUser, tid);
  }, [router]);

  const loadData = async (storedUser: NavUser, tid: string) => {
    setLoading(true);
    setError("");
    try {
      const companiesList = await api.get(`/company/tenant/${tid}`);
      const myId = storedUser.companyId || (storedUser as any).company_id;
      const myCompany = companiesList.find((c: any) => c.company_id === myId) || companiesList[0];
      setActiveCompany(myCompany || null);

      if (myCompany?.company_id) {
        const [configs, logsList] = await Promise.all([
          api.get(`/notification/company/${myCompany.company_id}`).catch(() => []),
          api.get(`/notification/logs/${myCompany.company_id}`).catch(() => [])
        ]);
        setConfigs(Array.isArray(configs) ? configs : []);
        setLogs(Array.isArray(logsList) ? logsList.reverse() : []);

        const emailCfg = configs?.find((c: any) => c.channel === "EMAIL");
        const webhookCfg = configs?.find((c: any) => c.channel === "WEBHOOK");
        if (emailCfg) setEmailForm({
          smtp_host: emailCfg.smtp_host || "", smtp_port: emailCfg.smtp_port || 587,
          smtp_user: emailCfg.smtp_user || "", smtp_password_enc: emailCfg.smtp_password_enc || "",
          from_email: emailCfg.from_email || "", from_name: emailCfg.from_name || "NAVFarm Alerts",
        });
        if (webhookCfg) setWebhookForm({
          webhook_url: webhookCfg.webhook_url || "", webhook_secret_enc: webhookCfg.webhook_secret_enc || "",
        });
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load notification config.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const existing = configs.find((config) => config.channel === "EMAIL");
      if (existing) {
        await api.put(`/notification/${existing.notif_id}`, emailForm);
      } else {
        const created = await api.post("/notification", { company_id: activeCompany.company_id, channel: "EMAIL", ...emailForm });
        setConfigs((current) => [...current, created]);
      }
      setSuccess("Email notification settings saved.");
    } catch (err: any) { setError(err?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const existing = configs.find((config) => config.channel === "WEBHOOK");
      if (existing) {
        await api.put(`/notification/${existing.notif_id}`, webhookForm);
      } else {
        const created = await api.post("/notification", { company_id: activeCompany.company_id, channel: "WEBHOOK", ...webhookForm });
        setConfigs((current) => [...current, created]);
      }
      setSuccess("Webhook settings saved.");
    } catch (err: any) { setError(err?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !testRecipient) return;
    setTesting(true); setError(""); setSuccess("");
    try {
      // Find the email config to get the correct configId
      const configs = await api.get(`/notification/company/${activeCompany.company_id}`).catch(() => []);
      const emailCfg = configs?.find((c: any) => c.channel === "EMAIL");
      if (!emailCfg) {
        throw new Error("Please configure and save SMTP details first before sending a test notification.");
      }

      await api.post("/notification/test", { configId: emailCfg.notif_id, recipient: testRecipient, message: testMessage });
      setSuccess(`Test notification sent successfully!`);
      setShowTestDialog(false);

      // Reload logs
      const updatedLogs = await api.get(`/notification/logs/${activeCompany.company_id}`).catch(() => []);
      setLogs(Array.isArray(updatedLogs) ? updatedLogs.reverse() : []);
    } catch (err: any) { setError(err?.message || "Failed to send test."); }
    finally { setTesting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin w-5 h-5 mr-2" style={{ color: "var(--accent)" }} />
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading notification settings…</span>
      </div>
    );
  }

  const tabCls = (tab: string) => `px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
    activeChannel === tab
      ? "border-[var(--accent)]"
      : "border-transparent"
  }`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Notification Engine</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Configure outbound alert channels for <span className="font-medium">{activeCompany?.company_name || "—"}</span>
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-(--danger) bg-(--danger-muted) border border-(--danger) rounded-lg p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-(--success) bg-(--success-muted) border border-(--success) rounded-lg p-4 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Channel Tabs */}
      <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex border-b px-2" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => setActiveChannel("EMAIL")}
            className={tabCls("EMAIL")}
            style={{ color: activeChannel === "EMAIL" ? "var(--accent)" : "var(--text-secondary)" }}>
            <Mail className="w-4 h-4" /> Email (SMTP)
          </button>
          <button onClick={() => setActiveChannel("WEBHOOK")}
            className={tabCls("WEBHOOK")}
            style={{ color: activeChannel === "WEBHOOK" ? "var(--accent)" : "var(--text-secondary)" }}>
            <Globe className="w-4 h-4" /> Webhook
          </button>
        </div>

        <div className="p-6">
          {activeChannel === "EMAIL" && (
            <form onSubmit={handleSaveEmail} className="space-y-5">
              <h2 className="nf-text-label-strong" style={{ color: "var(--text-primary)" }}>SMTP Configuration</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="SMTP Host">
                  <input value={emailForm.smtp_host} onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com" className={inputCls} style={inputStyle} />
                </Field>
                <Field label="SMTP Port">
                  <input type="number" value={emailForm.smtp_port} onChange={(e) => setEmailForm({ ...emailForm, smtp_port: +e.target.value })}
                    className={inputCls} style={inputStyle} />
                </Field>
                <Field label="SMTP Username">
                  <input value={emailForm.smtp_user} onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })}
                    placeholder="your@gmail.com" className={inputCls} style={inputStyle} />
                </Field>
                <Field label="App Password">
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"}
                      value={emailForm.smtp_password_enc}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_password_enc: e.target.value })}
                      placeholder="App-specific password" className={`${inputCls} pr-10`} style={inputStyle} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="From Email">
                  <input type="email" value={emailForm.from_email}
                    onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                    placeholder="alerts@yourcompany.com" className={inputCls} style={inputStyle} />
                </Field>
                <Field label="From Name">
                  <input value={emailForm.from_name} onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                    placeholder="NAVFarm Alerts" className={inputCls} style={inputStyle} />
                </Field>
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "var(--accent)" }}>
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save Email Config"}
                </button>
              </div>
            </form>
          )}

          {activeChannel === "WEBHOOK" && (
            <form onSubmit={handleSaveWebhook} className="space-y-5">
              <h2 className="nf-text-label-strong" style={{ color: "var(--text-primary)" }}>Webhook Configuration</h2>
              <div className="space-y-4">
                <Field label="Webhook URL">
                  <input type="url" value={webhookForm.webhook_url}
                    onChange={(e) => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })}
                    placeholder="https://hooks.slack.com/services/…" className={inputCls} style={inputStyle} />
                </Field>
                <Field label="Secret Key (Optional)">
                  <input value={webhookForm.webhook_secret_enc}
                    onChange={(e) => setWebhookForm({ ...webhookForm, webhook_secret_enc: e.target.value })}
                    placeholder="Signing secret for payload verification" className={inputCls} style={inputStyle} />
                </Field>
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "var(--accent)" }}>
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save Webhook Config"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Test Send */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-sm)] border bg-(--surface) p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-(--info-muted) p-2 text-(--info)">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Test your notification setup</h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Send a one-time message after saving your channel configuration.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setShowTestDialog(true)}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-(--accent) px-4 text-sm font-semibold text-white transition hover:bg-(--accent-hover)">
          <Send className="h-4 w-4" /> Send test
        </button>
      </div>

      <Dialog
        open={showTestDialog}
        onClose={() => !testing && setShowTestDialog(false)}
        title="Send test notification"
        description="Confirm the recipient and message. This sends a real test through the saved email configuration."
        maxWidth="md"
      >
        <form onSubmit={handleTestSend} className="space-y-5">
          <Field label="Recipient Email">
            <input type="email" required autoFocus value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="recipient@example.com" className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Test Message">
            <textarea required rows={4} value={testMessage} onChange={(e) => setTestMessage(e.target.value)}
              className={`${inputCls} resize-y`} style={inputStyle} />
          </Field>
          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: "var(--border)" }}>
            <button type="button" disabled={testing} onClick={() => setShowTestDialog(false)}
              className="min-h-10 rounded-lg border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--text-secondary) hover:bg-(--surface-raised) disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={testing || !testRecipient}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-(--accent) px-5 text-sm font-semibold text-white hover:bg-(--accent-hover) disabled:opacity-50">
              {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {testing ? "Sending…" : "Send test"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Notification Logs */}
      <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <h2 className="nf-text-label-strong" style={{ color: "var(--text-primary)" }}>Outbound Notification Logs</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "var(--badge-bg)", color: "var(--text-secondary)" }}>
            {logs.length} Log Entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4 w-32">Timestamp</th>
                <th className="p-4 w-24">Channel</th>
                <th className="p-4 w-44">Recipient</th>
                <th className="p-4">Message Details</th>
                <th className="p-4 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
                    No notification attempts logged for this company.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const isSuccess = log.status === "SUCCESS";
                  return (
                    <tr key={log.log_id || idx} className="border-b transition-colors" style={{ borderColor: "var(--border)" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--row-hover)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td className="p-4 text-center font-mono" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                      <td className="p-4 font-mono" style={{ color: "var(--text-muted)" }}>
                        {new Date(log.sent_at).toLocaleString('en-IN', { hour12: true })}
                      </td>
                      <td className="p-4">
                        {/* Channel is which pipe carried the message, not a
                            status — two colours here implied one was better. */}
                        <Badge variant="neutral">{log.channel}</Badge>
                      </td>
                      <td className="p-4 font-medium font-mono" style={{ color: "var(--text-secondary)" }}>{log.recipient}</td>
                      <td className="p-4">
                        <div style={{ color: "var(--text-primary)" }} className="font-semibold">{log.message}</div>
                        {log.error_message && (
                          <div className="text-[10px] text-rose-500 mt-1 font-mono">{log.error_message}</div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-semibold border px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                          isSuccess
                            ? "bg-(--success-muted) text-(--success) border-(--success)"
                            : "bg-(--danger-muted) text-(--danger) border-(--danger)"
                        }`}>
                          {isSuccess ? "Sent" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
