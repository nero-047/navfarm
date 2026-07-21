import React, { useState, useEffect } from "react";
import Card from "../../source-ui/card";
import Input from "../../source-ui/input";
import Button from "../../source-ui/button";
import { Mail, Globe, Save, Send, AlertCircle, CheckCircle, ToggleLeft, ToggleRight } from "lucide-react";
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
    smtp_password_enc: "",
    from_email: "",
    from_name: "NAVFarm Alerts"
  });

  const [webhookForm, setWebhookForm] = useState({
    webhook_url: "",
    webhook_secret_enc: ""
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

      // Pre-fill forms if config exists
      const email = list.find((c: any) => c.channel === "EMAIL");
      if (email) {
        setEmailForm({
          smtp_host: email.smtp_host || "",
          smtp_port: email.smtp_port || 587,
          smtp_user: email.smtp_user || "",
          smtp_password_enc: email.smtp_password_enc || "",
          from_email: email.from_email || "",
          from_name: email.from_name || "NAVFarm Alerts"
        });
      }

      const webhook = list.find((c: any) => c.channel === "WEBHOOK");
      if (webhook) {
        setWebhookForm({
          webhook_url: webhook.webhook_url || "",
          webhook_secret_enc: webhook.webhook_secret_enc || ""
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
      const existing = configs.find(c => c.channel === "EMAIL");
      if (existing) {
        await api.put(`/notification/${existing.notif_id}`, {
          ...emailForm,
          is_enabled: true
        });
      } else {
        await api.post("/notification", {
          company_id: companyId,
          channel: "EMAIL",
          is_enabled: true,
          ...emailForm
        });
      }
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
      const existing = configs.find(c => c.channel === "WEBHOOK");
      if (existing) {
        await api.put(`/notification/${existing.notif_id}`, {
          ...webhookForm,
          is_enabled: true
        });
      } else {
        await api.post("/notification", {
          company_id: companyId,
          channel: "WEBHOOK",
          is_enabled: true,
          ...webhookForm
        });
      }
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
        <div className="fixed top-4 right-4 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl z-50 flex items-center gap-2 max-w-md shadow-lg backdrop-blur">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm">{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="fixed top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-xl z-50 flex items-center gap-2 max-w-md shadow-lg backdrop-blur">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm">{actionSuccess}</span>
        </div>
      )}

      {/* Configurations Left Panel */}
      <div className="md:col-span-8 flex flex-col gap-6">

        {/* Toggle Channel selector */}
        <div className="flex gap-4 p-1.5 bg-[#0b0f19] border border-[#1a1f2e] rounded-2xl">
          <button
            onClick={() => setActiveChannel("EMAIL")}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeChannel === "EMAIL"
                ? "bg-teal-500/10 border border-teal-500/20 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Mail className="w-4 h-4" /> SMTP Email Server
          </button>
          <button
            onClick={() => setActiveChannel("WEBHOOK")}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeChannel === "WEBHOOK"
                ? "bg-teal-500/10 border border-teal-500/20 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Globe className="w-4 h-4" /> Outgoing Webhooks
          </button>
        </div>

        {activeChannel === "EMAIL" && (
          <Card className="p-6 border-[#1a1f2e] bg-[#0b0f19]">
            <form onSubmit={handleSaveEmail} className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[#1a1f2e] pb-3 mb-2">
                <h3 className="font-bold text-white text-sm">SMTP Gateway Integration</h3>
                {configs.find(c => c.channel === "EMAIL") && (
                  <button
                    type="button"
                    onClick={() => {
                      const email = configs.find(c => c.channel === "EMAIL");
                      toggleChannelEnabled(email.notif_id, email.is_enabled);
                    }}
                    className="text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    {configs.find(c => c.channel === "EMAIL")?.is_enabled ? (
                      <>Active <ToggleRight className="w-6 h-6 text-teal-400" /></>
                    ) : (
                      <>Inactive <ToggleLeft className="w-6 h-6 text-gray-650" /></>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="SMTP Hostname"
                  placeholder="smtp.mailgun.org"
                  value={emailForm.smtp_host}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                  required
                />
                <Input
                  label="SMTP Port"
                  type="number"
                  placeholder="587"
                  value={emailForm.smtp_port.toString()}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value) || 587 })}
                  required
                />
                <Input
                  label="SMTP User / Key"
                  placeholder="postmaster@yourdomain.com"
                  value={emailForm.smtp_user}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })}
                  required
                />
                <Input
                  label="SMTP Password"
                  type="password"
                  placeholder="••••••••"
                  value={emailForm.smtp_password_enc}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_password_enc: e.target.value })}
                  required
                />
                <Input
                  label="Sender Email (From)"
                  placeholder="alerts@navfarm.com"
                  type="email"
                  value={emailForm.from_email}
                  onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                  required
                />
                <Input
                  label="Sender Display Name"
                  placeholder="NAVFarm Systems"
                  value={emailForm.from_name}
                  onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="mt-4 self-end flex items-center gap-2 text-xs">
                <Save className="w-4 h-4" /> Save SMTP Gateway
              </Button>
            </form>
          </Card>
        )}

        {activeChannel === "WEBHOOK" && (
          <Card className="p-6 border-[#1a1f2e] bg-[#0b0f19]">
            <form onSubmit={handleSaveWebhook} className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[#1a1f2e] pb-3 mb-2">
                <h3 className="font-bold text-white text-sm">HTTP Webhook Triggers</h3>
                {configs.find(c => c.channel === "WEBHOOK") && (
                  <button
                    type="button"
                    onClick={() => {
                      const webhook = configs.find(c => c.channel === "WEBHOOK");
                      toggleChannelEnabled(webhook.notif_id, webhook.is_enabled);
                    }}
                    className="text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    {configs.find(c => c.channel === "WEBHOOK")?.is_enabled ? (
                      <>Active <ToggleRight className="w-6 h-6 text-teal-400" /></>
                    ) : (
                      <>Inactive <ToggleLeft className="w-6 h-6 text-gray-650" /></>
                    )}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <Input
                  label="Endpoint URL"
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookForm.webhook_url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })}
                  required
                />
                <Input
                  label="Signing Secret Key (Optional)"
                  type="password"
                  placeholder="Secret payload validation hash key"
                  value={webhookForm.webhook_secret_enc}
                  onChange={(e) => setWebhookForm({ ...webhookForm, webhook_secret_enc: e.target.value })}
                />
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
        <Card className="p-6 border-[#1a1f2e] bg-[#0b0f19]">
          <h4 className="font-bold text-white text-sm border-b border-[#1a1f2e] pb-3 mb-4">Send Test Notification</h4>
          <form onSubmit={handleSendTest} className="flex flex-col gap-4">
            <Input
              label={activeChannel === "EMAIL" ? "Test Recipient Email" : "Test Endpoint URL override"}
              placeholder={activeChannel === "EMAIL" ? "recipient@domain.com" : "Leave blank to use default endpoint"}
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Notification Body Message</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-[#121824] border border-[#1a1f2e] rounded-xl p-3 text-xs text-white h-24 focus:outline-none focus:border-teal-500 outline-none"
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
