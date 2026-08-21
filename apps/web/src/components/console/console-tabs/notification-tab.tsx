import React, { useState, useEffect } from "react";
import { Toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Globe, Save, Send, ToggleLeft, ToggleRight } from "lucide-react";
import { api } from "../../../services/api-client";

interface NotificationTabProps {
  companyId: string;
}

export default function NotificationTab({ companyId }: NotificationTabProps) {
  const [configs, setConfigs] = useState<any[]>([]);
  const [, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active configuration forms
  const [activeChannel, setActiveChannel] = useState<"EMAIL" | "WEBHOOK">("EMAIL");
  const [emailForm, setEmailForm] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
    from_email: "",
    from_name: "NAVFarm Alerts"
  });

  const [webhookForm, setWebhookForm] = useState({
    webhook_url: "",
    webhook_secret: ""
  });

  // Test send state
  const [testRecipient, setTestRecipient] = useState("");
  const [testMessage, setTestMessage] = useState("This is a live test notification from your NAVFarm workspace.");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, [companyId]);

  const fetchConfigs = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const list = await api.get(`/notification/company/${companyId}`);
      setConfigs(list || []);

      // Pre-fill forms if config exists. smtp_password / webhook_secret are never
      // returned by the API once saved (encrypted at rest) — leave blank; submitting
      // blank keeps the existing secret, typing a new value replaces it.
      const email = list.find((c: any) => c.channel === "EMAIL");
      if (email) {
        setEmailForm({
          smtp_host: email.smtp_host || "",
          smtp_port: email.smtp_port || 587,
          smtp_user: email.smtp_user || "",
          smtp_password: "",
          from_email: email.from_email || "",
          from_name: email.from_name || "NAVFarm Alerts"
        });
      }

      const webhook = list.find((c: any) => c.channel === "WEBHOOK");
      if (webhook) {
        setWebhookForm({
          webhook_url: webhook.webhook_url || "",
          webhook_secret: ""
        });
      }
    } catch (e: any) {
      console.error(e);
      setActionError("Failed to fetch notification configurations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError("");
    setActionSuccess("");
    try {
      // Omit smtp_password entirely when left blank, so re-saving other fields
      // never wipes an already-configured secret the server won't echo back.
      const { smtp_password, ...emailFormRest } = emailForm;
      const emailPayload = smtp_password ? { ...emailFormRest, smtp_password } : emailFormRest;

      const existing = configs.find(c => c.channel === "EMAIL");
      if (existing) {
        await api.put(`/notification/${existing.notif_id}`, {
          ...emailPayload,
          is_enabled: true
        });
      } else {
        await api.post("/notification", {
          company_id: companyId,
          channel: "EMAIL",
          is_enabled: true,
          ...emailPayload
        });
      }
      setEmailForm(f => ({ ...f, smtp_password: "" }));
      setActionSuccess("Email SMTP configuration saved successfully!");
      fetchConfigs();
    } catch (err: any) {
      setActionError(err?.message || "Failed to save SMTP configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError("");
    setActionSuccess("");
    try {
      const { webhook_secret, ...webhookFormRest } = webhookForm;
      const webhookPayload = webhook_secret ? { ...webhookFormRest, webhook_secret } : webhookFormRest;

      const existing = configs.find(c => c.channel === "WEBHOOK");
      if (existing) {
        await api.put(`/notification/${existing.notif_id}`, {
          ...webhookPayload,
          is_enabled: true
        });
      } else {
        await api.post("/notification", {
          company_id: companyId,
          channel: "WEBHOOK",
          is_enabled: true,
          ...webhookPayload
        });
      }
      setWebhookForm(f => ({ ...f, webhook_secret: "" }));
      setActionSuccess("Outgoing webhook settings updated successfully!");
      fetchConfigs();
    } catch (err: any) {
      setActionError(err?.message || "Failed to save webhook settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannelEnabled = async (notifId: string, currentEnabled: boolean) => {
    setActionError("");
    setActionSuccess("");
    try {
      await api.put(`/notification/${notifId}`, {
        is_enabled: !currentEnabled
      });
      setActionSuccess("Channel status updated.");
      fetchConfigs();
    } catch (err: any) {
      setActionError(err?.message || "Failed to toggle status.");
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) {
      setActionError("Please provide a recipient email or endpoint.");
      return;
    }
    const currentConfig = configs.find(c => c.channel === activeChannel);
    if (!currentConfig) {
      setActionError(`Please configure and save the ${activeChannel} channel first.`);
      return;
    }

    setSendingTest(true);
    setActionError("");
    setActionSuccess("");
    try {
      await api.post("/notification/test", {
        configId: currentConfig.notif_id,
        recipient: testRecipient,
        message: testMessage
      });
      setActionSuccess(`Test notification sent successfully via ${activeChannel}!`);
      setTestRecipient("");
      fetchConfigs();
    } catch (err: any) {
      setActionError(err?.message || "Failed to dispatch test notification.");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative animate-fade-in">

      {/* Toast Alert Feedbacks */}
      {actionError && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Toast variant="danger" message={actionError} />
        </div>
      )}
      {actionSuccess && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Toast variant="success" message={actionSuccess} />
        </div>
      )}

      {/* Configurations Left Panel */}
      <div className="md:col-span-8 flex flex-col gap-6">

        {/* Toggle Channel selector */}
        <div className="flex gap-4 p-1.5 rounded-[var(--radius-md)] border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <button
            onClick={() => setActiveChannel("EMAIL")}
            className={`flex-1 py-3 rounded-[var(--radius-sm)] text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeChannel === "EMAIL"
                ? "border text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent"
            }`}
            style={activeChannel === "EMAIL" ? { backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.2)" } : {}}
          >
            <Mail className="w-4 h-4" /> SMTP Email Server
          </button>
          <button
            onClick={() => setActiveChannel("WEBHOOK")}
            className={`flex-1 py-3 rounded-[var(--radius-sm)] text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeChannel === "WEBHOOK"
                ? "border text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent"
            }`}
            style={activeChannel === "WEBHOOK" ? { backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.2)" } : {}}
          >
            <Globe className="w-4 h-4" /> Outgoing Webhooks
          </button>
        </div>

        {activeChannel === "EMAIL" && (
          <Card className="p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <form onSubmit={handleSaveEmail} className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b pb-3 mb-2" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>SMTP Gateway Integration</h3>
                {configs.find(c => c.channel === "EMAIL") && (
                  <button
                    type="button"
                    onClick={() => {
                      const email = configs.find(c => c.channel === "EMAIL");
                      toggleChannelEnabled(email.notif_id, email.is_enabled);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {configs.find(c => c.channel === "EMAIL")?.is_enabled ? (
                      <>Active <ToggleRight className="w-6 h-6" style={{ color: "var(--accent)" }} /></>
                    ) : (
                      <>Inactive <ToggleLeft className="w-6 h-6" style={{ color: "var(--text-muted)" }} /></>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="SMTP Hostname" htmlFor="smtp-host" required>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.mailgun.org"
                    value={emailForm.smtp_host}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                    required
                  />
                </Field>
                <Field label="SMTP Port" htmlFor="smtp-port" required>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="587"
                    value={emailForm.smtp_port.toString()}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value) || 587 })}
                    required
                  />
                </Field>
                <Field label="SMTP User / Key" htmlFor="smtp-user" required>
                  <Input
                    id="smtp-user"
                    placeholder="postmaster@yourdomain.com"
                    value={emailForm.smtp_user}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })}
                    required
                  />
                </Field>
                <Field
                  label={configs.find(c => c.channel === "EMAIL")?.smtp_password_configured ? "SMTP Password (configured — leave blank to keep)" : "SMTP Password"}
                  htmlFor="smtp-password"
                  required={!configs.find(c => c.channel === "EMAIL")}
                >
                  <Input
                    id="smtp-password"
                    type="password"
                    placeholder="••••••••"
                    value={emailForm.smtp_password}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                    required={!configs.find(c => c.channel === "EMAIL")}
                  />
                </Field>
                <Field label="Sender Email (From)" htmlFor="smtp-from-email" required>
                  <Input
                    id="smtp-from-email"
                    placeholder="alerts@navfarm.com"
                    type="email"
                    value={emailForm.from_email}
                    onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Sender Display Name" htmlFor="smtp-from-name" required>
                  <Input
                    id="smtp-from-name"
                    placeholder="NAVFarm Systems"
                    value={emailForm.from_name}
                    onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <Button type="submit" disabled={isSubmitting} className="mt-4 self-end flex items-center gap-2 text-xs">
                <Save className="w-4 h-4" /> Save SMTP Gateway
              </Button>
            </form>
          </Card>
        )}

        {activeChannel === "WEBHOOK" && (
          <Card className="p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <form onSubmit={handleSaveWebhook} className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b pb-3 mb-2" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>HTTP Webhook Triggers</h3>
                {configs.find(c => c.channel === "WEBHOOK") && (
                  <button
                    type="button"
                    onClick={() => {
                      const webhook = configs.find(c => c.channel === "WEBHOOK");
                      toggleChannelEnabled(webhook.notif_id, webhook.is_enabled);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {configs.find(c => c.channel === "WEBHOOK")?.is_enabled ? (
                      <>Active <ToggleRight className="w-6 h-6" style={{ color: "var(--accent)" }} /></>
                    ) : (
                      <>Inactive <ToggleLeft className="w-6 h-6" style={{ color: "var(--text-muted)" }} /></>
                    )}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <Field label="Endpoint URL" htmlFor="webhook-url" required>
                  <Input
                    id="webhook-url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={webhookForm.webhook_url}
                    onChange={(e) => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })}
                    required
                  />
                </Field>
                <Field
                  label={configs.find(c => c.channel === "WEBHOOK")?.webhook_secret_configured ? "Signing Secret Key (configured — leave blank to keep)" : "Signing Secret Key (Optional)"}
                  htmlFor="webhook-secret"
                >
                  <Input
                    id="webhook-secret"
                    type="password"
                    placeholder="Secret payload validation hash key"
                    value={webhookForm.webhook_secret}
                    onChange={(e) => setWebhookForm({ ...webhookForm, webhook_secret: e.target.value })}
                  />
                </Field>
              </div>

              <Button type="submit" disabled={isSubmitting} className="mt-4 self-end flex items-center gap-2 text-xs">
                <Save className="w-4 h-4" /> Save Webhook Config
              </Button>
            </form>
          </Card>
        )}
      </div>

      {/* Right Side Test Dispatch Panel */}
      <div className="md:col-span-4 flex flex-col gap-6">
        <Card className="p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h4 className="font-semibold text-sm border-b pb-3 mb-4" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>Send Test Notification</h4>
          <form onSubmit={handleSendTest} className="flex flex-col gap-4">
            <Field
              label={activeChannel === "EMAIL" ? "Test Recipient Email" : "Test Endpoint URL override"}
              htmlFor="test-recipient"
              required
            >
              <Input
                id="test-recipient"
                placeholder={activeChannel === "EMAIL" ? "recipient@domain.com" : "Leave blank to use default endpoint"}
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                required
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Notification Body Message</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="nf-input w-full h-24 p-3 text-xs"
                required
              />
            </div>
            <Button type="submit" disabled={sendingTest} className="w-full flex items-center justify-center gap-2 text-xs">
              <Send className="w-4 h-4" /> {sendingTest ? "Sending Dispatch..." : "Send Test Dispatch"}
            </Button>
          </form>
        </Card>
      </div>

    </div>
  );
}
