import React, { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Building2,
  Plus,
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  MapPin,
  Contact,
  Globe,
  Calendar,
  Layers,
  Check,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { api } from "../../../services/api-client";
import { Dialog } from "../../ui/dialog";
import { FullPageDialogBoundary } from "../../ui/full-page-overlay";
import { EditMemberModal, ActiveStatusBadge } from "../edit-member-modal";
import { useLanguage } from "@/hooks/useLanguage";

interface CompanyTabProps {
  activeCompany: any;
  currencies: any[];
  tenantId?: string;
  onRefreshCompany?: (selectCompanyId?: string) => Promise<void>;
  companies?: any[];
  currentUser?: any;
  onSelectCompany?: (company: any) => void;
  /** When true, skip the Corporate Directory list and go straight to company settings */
  skipDirectory?: boolean;
}

export default function CompanyTab({
  activeCompany,
  currencies,
  tenantId,
  onRefreshCompany,
  companies = [],
  currentUser,
  onSelectCompany,
  skipDirectory = false,
}: CompanyTabProps) {
  const { t } = useLanguage();
  const isTenantAdmin = currentUser?.userType === "TENANT_ADMIN";
  const isCompanyAdmin = currentUser?.userType === "COMPANY_ADMIN";
  const canEditCompany = isTenantAdmin || isCompanyAdmin;

  // Navigation context
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<any>(null);

  // Users of the selected details company context
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // New admin form context
  const [adminForm, setAdminForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: ""
  });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [userPendingDeletion, setUserPendingDeletion] = useState<string | null>(null);

  // View/edit a single operator — reuses the same modal as Team Management
  // (profile, Active toggle, role assignment, company access) instead of
  // this panel only ever offering a one-way Deactivate.
  const [editingOperator, setEditingOperator] = useState<any | null>(null);
  const [operatorRoles, setOperatorRoles] = useState<any[]>([]);

  // 8 steps detailed setup configuration context
  const [setupDetails, setSetupDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [setupLoadWarning, setSetupLoadWarning] = useState("");
  const [settingsTab, setSettingsTab] = useState<"profile" | "address" | "contact" | "localization" | "fiscal" | "modules">("profile");

  // Support catalogs fetched on mount
  const [languages, setLanguages] = useState<any[]>([]);
  const [nobs, setNobs] = useState<any[]>([]);

  // Mapping of NOB ID to its LOBs list for Step 8 editing
  const [lobMap, setLobMap] = useState<Record<string, any[]>>({});
  const [loadingLobs, setLoadingLobs] = useState<Record<string, boolean>>({});

  // Edit settings context for the active tab
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form states matching wizard steps
  const [profileForm, setProfileForm] = useState({
    company_code: "",
    company_name: "",
    company_display_name: "",
    company_type: "Pvt Ltd",
    industry_type: "Poultry Farming",
    registration_no: "",
    tax_id: "",
    tax_regime: "STANDARD",
    incorporation_date: "",
    website: "",
    email_domain: "",
    support_email: "",
    phone_primary: "",
    company_logo_url: "",
    primary_color_hex: "#1F4E79"
  });

  const [addressForm, setAddressForm] = useState({
    address_type: "HQ",
    address_label: "",
    line1: "",
    line2: "",
    city: "",
    state_id: "",
    country_id: "IND",
    pincode: "",
    gps_latitude: "",
    gps_longitude: ""
  });

  const [contactForm, setContactForm] = useState({
    contact_type: "Primary",
    full_name: "",
    designation: "Director",
    email: "",
    phone_primary: "",
    phone_secondary: "",
    receives_alerts: false,
    receives_reports: false
  });

  const [localizationForm, setLocalizationForm] = useState({
    default_language_id: "",
    base_currency_id: "",
    default_timezone_id: "Asia/Kolkata",
    country_id: "IND"
  });

  const [fiscalForm, setFiscalForm] = useState({
    fiscal_start_month: 4,
    fiscal_start_day: 1,
    fiscal_end_day: 31,
    current_fiscal_year: "2026-27",
    period_type: "MONTHLY",
    accounting_standard: "Local GAAP",
    depreciation_method: "SLM",
    inventory_valuation: "FIFO",
    gst_filing_frequency: "MONTHLY",
    tax_audit_applicable: false,
    decimal_places: 2
  });


  const [modulesForm, setModulesForm] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create company modal (Tenant Admin only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    company_code: "",
    company_name: "",
    company_display_name: "",
    company_type: "Pvt Ltd",
    industry_type: "Poultry Farming",
    country_id: "IND",
    default_timezone_id: "Asia/Kolkata",
    registration_no: "",
    tax_id: "",
    primary_color_hex: "#1F4E79"
  });
  const [creating, setCreating] = useState(false);

  // Determine active company details context
  const targetCompany = isTenantAdmin ? (selectedCompanyDetails || activeCompany) : activeCompany;

  // Load catalogs on mount — fetch independently so one failure doesn't block the other
  useEffect(() => {
    const fetchCatalogs = async () => {
      // Languages live at /language (GET), not /setup/wizard/languages
      const [langsResult, nobsResult] = await Promise.allSettled([
        api.get("/language"),
        api.get("/setup/wizard/nobs"),
      ]);
      if (langsResult.status === "fulfilled") setLanguages(langsResult.value || []);
      if (nobsResult.status  === "fulfilled") setNobs(nobsResult.value  || []);
    };
    fetchCatalogs();
  }, []);

  const fetchCompanyUsers = async (companyId: string) => {
    setLoadingUsers(true);
    try {
      const data = await api.get(`/user/company/${companyId}`);
      setCompanyUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch company operators:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchOperatorRoles = async (companyId: string) => {
    try {
      const data = await api.get(`/role/company/${companyId}`);
      setOperatorRoles(Array.isArray(data) ? data : []);
    } catch {
      setOperatorRoles([]);
    }
  };

  const fetchSetupDetails = async (companyId: string) => {
    setLoadingDetails(true);
    setSetupLoadWarning("");
    setSetupDetails(null);
    try {
      const details = await api.get(`/setup/wizard/company-details/${companyId}`);
      setSetupDetails(details);
    } catch {
      setSetupLoadWarning("Some setup details are temporarily unavailable. Available information is still shown.");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (targetCompany?.company_id) {
      fetchCompanyUsers(targetCompany.company_id);
      fetchOperatorRoles(targetCompany.company_id);
      fetchSetupDetails(targetCompany.company_id);
      setIsEditing(false);
    }
  }, [targetCompany?.company_id]);

  // Sync details response or targetCompany to states
  useEffect(() => {
    const comp = setupDetails?.company || targetCompany;
    if (comp) {
      setProfileForm({
        company_code: comp.company_code || "",
        company_name: comp.company_name || "",
        company_display_name: comp.company_display_name || "",
        company_type: comp.company_type || "Pvt Ltd",
        industry_type: comp.industry_type || "Poultry Farming",
        registration_no: comp.registration_no || "",
        tax_id: comp.tax_id || "",
        tax_regime: comp.tax_regime || "STANDARD",
        incorporation_date: comp.incorporation_date || "",
        website: comp.website || "",
        email_domain: comp.email_domain || "",
        support_email: comp.support_email || "",
        phone_primary: comp.phone_primary || "",
        company_logo_url: comp.company_logo_url || "",
        primary_color_hex: comp.primary_color_hex || "#1F4E79"
      });

      setAddressForm({
        address_type: setupDetails?.address?.address_type || "HQ",
        address_label: setupDetails?.address?.address_label || "",
        line1: setupDetails?.address?.line1 || "",
        line2: setupDetails?.address?.line2 || "",
        city: setupDetails?.address?.city || "",
        state_id: setupDetails?.address?.state_id || "",
        country_id: setupDetails?.address?.country_id || comp.country_id || "IND",
        pincode: setupDetails?.address?.pincode || "",
        gps_latitude: setupDetails?.address?.gps_latitude || "",
        gps_longitude: setupDetails?.address?.gps_longitude || ""
      });

      setContactForm({
        contact_type: setupDetails?.contact?.contact_type || "Primary",
        full_name: setupDetails?.contact?.full_name || "",
        designation: setupDetails?.contact?.designation || "Director",
        email: setupDetails?.contact?.email || comp.support_email || "",
        phone_primary: setupDetails?.contact?.phone_primary || comp.phone_primary || "",
        phone_secondary: setupDetails?.contact?.phone_secondary || "",
        receives_alerts: setupDetails?.contact?.receives_alerts || false,
        receives_reports: setupDetails?.contact?.receives_reports || false
      });

      setLocalizationForm({
        default_language_id: comp.default_language_id || "",
        base_currency_id: comp.base_currency_id || "",
        default_timezone_id: comp.default_timezone_id || "Asia/Kolkata",
        country_id: comp.country_id || "IND"
      });

      setFiscalForm({
        fiscal_start_month: setupDetails?.fiscal?.fiscal_start_month || comp.financial_year_start || 4,
        fiscal_start_day: setupDetails?.fiscal?.fiscal_start_day || 1,
        fiscal_end_day: setupDetails?.fiscal?.fiscal_end_day || 31,
        current_fiscal_year: setupDetails?.fiscal?.current_fiscal_year || "2026-27",
        period_type: setupDetails?.fiscal?.period_type || "MONTHLY",
        accounting_standard: setupDetails?.fiscal?.accounting_standard || "Local GAAP",
        depreciation_method: setupDetails?.fiscal?.depreciation_method || "SLM",
        inventory_valuation: setupDetails?.fiscal?.inventory_valuation || "FIFO",
        gst_filing_frequency: setupDetails?.fiscal?.gst_filing_frequency || "MONTHLY",
        tax_audit_applicable: setupDetails?.fiscal?.tax_audit_applicable || false,
        decimal_places: setupDetails?.fiscal?.decimal_places ?? 2
      });

      if (setupDetails?.modules) {
        setModulesForm(setupDetails.modules);
      }
    }
  }, [setupDetails, targetCompany]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError("");

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await api.upload("/setup/wizard/upload-logo", data);
      setProfileForm(prev => ({ ...prev, company_logo_url: res.logoUrl }));
    } catch (err: any) {
      setError(err?.message || "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:2877';

  // Fetch LOBs list for selected NOBs in modulesForm editing

  useEffect(() => {
    if (settingsTab === "modules" && nobs.length > 0) {
      nobs.forEach(nob => {
        if (modulesForm.includes(nob.nob_code)) {
          fetchLobsForNob(nob.nob_id, nob.nob_code);
        }
      });
    }
  }, [modulesForm, settingsTab, nobs]);

  const fetchLobsForNob = async (nobId: string, nobCode: string) => {
    if (lobMap[nobId]) return;
    setLoadingLobs(prev => ({ ...prev, [nobId]: true }));
    try {
      const list = await api.get(`/setup/wizard/lobs/${nobId}`);
      setLobMap(prev => ({ ...prev, [nobId]: list || [] }));
    } catch (e) {
      console.error(`Failed to fetch LOBs for ${nobCode}:`, e);
    } finally {
      setLoadingLobs(prev => ({ ...prev, [nobId]: false }));
    }
  };

  const handleNobToggle = (nobCode: string, nobId: string) => {
    const isChecked = modulesForm.includes(nobCode);
    if (isChecked) {
      const associatedLobs = lobMap[nobId] || [];
      const associatedCodes = associatedLobs.map(l => l.lob_code);
      setModulesForm(modulesForm.filter(code => code !== nobCode && !associatedCodes.includes(code)));
    } else {
      setModulesForm([...modulesForm, nobCode]);
    }
  };

  const handleLobToggle = (lobCode: string) => {
    const isChecked = modulesForm.includes(lobCode);
    if (isChecked) {
      setModulesForm(modulesForm.filter(code => code !== lobCode));
    } else {
      setModulesForm([...modulesForm, lobCode]);
    }
  };

  // Submit handlings for all steps
  const handleSaveTab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError("Tenant context is missing.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (settingsTab === "profile") {
        await api.post("/setup/wizard/step-1", {
          ...profileForm,
          tenant_id: tenantId,
          company_id: targetCompany.company_id
        });
      } else if (settingsTab === "address") {
        await api.post("/setup/wizard/step-2", {
          ...addressForm,
          company_id: targetCompany.company_id,
          gps_latitude: addressForm.gps_latitude ? parseFloat(addressForm.gps_latitude) : undefined,
          gps_longitude: addressForm.gps_longitude ? parseFloat(addressForm.gps_longitude) : undefined,
        });
      } else if (settingsTab === "contact") {
        await api.post("/setup/wizard/step-3", {
          ...contactForm,
          company_id: targetCompany.company_id
        });
      } else if (settingsTab === "localization") {
        const { default_language_id, base_currency_id, default_timezone_id, country_id } = localizationForm;
        await Promise.all([
          api.post(`/setup/wizard/step-4/${targetCompany.company_id}/${default_language_id}`),
          api.post(`/setup/wizard/step-5/${targetCompany.company_id}/${base_currency_id}`),
          api.post(`/setup/wizard/step-6/${targetCompany.company_id}/${encodeURIComponent(default_timezone_id)}/${country_id.toUpperCase()}`)
        ]);
      } else if (settingsTab === "fiscal") {
        const isAprilStart = parseInt(fiscalForm.fiscal_start_month as any) === 4;
        await api.post("/setup/wizard/step-7", {
          ...fiscalForm,
          company_id: targetCompany.company_id,
          fiscal_year_format: isAprilStart ? "FY APR-MAR" : "FY JAN-DEC",
          fiscal_start_day: 1
        });
      }

      setSuccess(`Company settings step updated successfully!`);
      setIsEditing(false);
      await fetchSetupDetails(targetCompany.company_id);
      if (onRefreshCompany) {
        await onRefreshCompany(targetCompany.company_id);
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update step parameter.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModules = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/setup/wizard/step-8/${targetCompany.company_id}`, {
        modules: modulesForm
      });
      setSuccess("Nature of Business and sub-sectors modules list saved!");
      setIsEditing(false);
      await fetchSetupDetails(targetCompany.company_id);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update modules configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError("Tenant ID not found.");
      return;
    }
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const payload: any = {
        ...createForm,
        default_language_id: undefined
      };

      const firstCurrencyId = currencies && currencies.length > 0 ? currencies[0]?.currency_id : null;
      if (firstCurrencyId && typeof firstCurrencyId === 'string' && firstCurrencyId.length === 36) {
        payload.base_currency_id = firstCurrencyId;
      }

      const createdCompany = await api.post("/company", payload);
      setSuccess(`Company '${createForm.company_name}' created successfully!`);
      setShowCreateModal(false);
      setCreateForm({
        company_code: "",
        company_name: "",
        company_display_name: "",
        company_type: "Pvt Ltd",
        industry_type: "Poultry Farming",
        country_id: "IND",
        default_timezone_id: "Asia/Kolkata",
        registration_no: "",
        tax_id: "",
        primary_color_hex: "#1F4E79"
      });

      if (onRefreshCompany && createdCompany?.company_id) {
        await onRefreshCompany(createdCompany.company_id);
      } else if (onRefreshCompany) {
        await onRefreshCompany();
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to create company.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddCompanyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompany?.company_id) return;
    setAddingAdmin(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/auth/register-admin", {
        email: adminForm.email,
        password_hash: adminForm.password,
        full_name: adminForm.fullName,
        phone: adminForm.phone,
        user_type: isTenantAdmin ? "COMPANY_ADMIN" : "STANDARD_USER",
        tenant_id: tenantId,
        company_id: targetCompany.company_id,
        timezone_pref_id: targetCompany.default_timezone_id || "Asia/Kolkata"
      });
      setSuccess(isTenantAdmin ? "New Company Administrator registered successfully!" : "New Company Operator registered successfully!");
      setAdminForm({ fullName: "", email: "", password: "", phone: "" });
      setShowAdminDialog(false);
      fetchCompanyUsers(targetCompany.company_id);
      if (onRefreshCompany) {
        await onRefreshCompany(targetCompany.company_id);
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to register company user.");
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setError("");
    setSuccess("");
    try {
      await api.delete(`/user/${userId}`);
      setSuccess("Account deactivated successfully!");
      setUserPendingDeletion(null);
      if (targetCompany?.company_id) {
        fetchCompanyUsers(targetCompany.company_id);
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to deactivate account.");
    }
  };

  // Render List View (Tenant Admin only when selectedCompanyDetails is null)
  if (isTenantAdmin && !selectedCompanyDetails && !skipDirectory) {
    return (
      <div className="flex w-full flex-col gap-4 animate-fade-in">

        {/* Feedback stays in the content flow so it never obscures actions. */}
        {error && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 border-(--danger) bg-(--danger-muted) text-(--danger)">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 border-(--success) bg-(--success-muted) text-(--success)">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="flex justify-between items-center bg-(--surface) border border-(--border) p-5 rounded-[var(--radius-md)]">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-(--text-primary) text-base">{t("ctDirectoryTitle")}</h3>
            <p className="text-xs text-(--text-secondary)">{t("ctDirectoryDesc")}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 py-2.5 px-4 text-xs cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />{t("ctAddCompany")}</Button>
        </div>

        <Card className="p-0 border-(--border) bg-(--surface) overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left">
              <TableHeader>
                <tr className="border-b border-(--row-border)">
                  <TableHead className="text-center w-12">#</TableHead>
                  <TableHead className="w-28">{t("paramColCode")}</TableHead>
                  <TableHead>{t("companyName")}</TableHead>
                  <TableHead className="w-44">{t("ctIndustry")}</TableHead>
                  <TableHead className="w-48">{t("ctIdentifiers")}</TableHead>
                  <TableHead className="text-center w-28">{t("btColStatus")}</TableHead>
                  <TableHead className="text-right w-36">{t("actionsColumn")}</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {companies.length === 0 ? (
                  <tr>
                    <TableCell colSpan={7} className="p-8 text-center" style={{ color: "var(--text-secondary)" }}>{t("ctNoCompanies")}</TableCell>
                  </tr>
                ) : (
                  companies.map((comp, idx) => (
                    <TableRow key={comp.company_id}>
                      <TableCell className="p-4 text-center font-mono" style={{ color: "var(--text-secondary)" }}>{idx + 1}</TableCell>
                      <TableCell className="p-4">
                        <span className="font-mono text-(--text-primary) bg-(--surface-raised) px-2 py-1 rounded-[var(--radius-xs)] border border-(--border) font-semibold">{comp.company_code}</span>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-(--text-primary)">{comp.company_name}</span>
                          <span className="text-[10px] text-(--text-secondary)">{comp.company_display_name || comp.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4" style={{ color: "var(--text-secondary)" }}>{comp.industry_type}</TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-col text-[10px] text-(--text-secondary) font-mono gap-0.5">
                          <span>Tax: {comp.tax_id || "—"}</span>
                          <span>Reg: {comp.registration_no || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-semibold ${
                          comp.onboarding_status === 'COMPLETED' ? 'bg-(--success-muted) text-(--success) border border-(--success)' : 'bg-(--warning-muted) text-(--warning) border border-(--warning)'
                        }`}>
                          {comp.onboarding_status || 'PENDING'}
                        </span>
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <Button
                          onClick={() => {
                            setSelectedCompanyDetails(comp);
                            if (onSelectCompany) onSelectCompany(comp);
                          }}
                          // w-full preserves the width this button had while the
                          // legacy primitive was display:flex — it is the one
                          // call site that sat in block flow rather than a flex row.
                          className="w-full py-1.5 px-3 text-[10px] uppercase font-semibold tracking-wider hover:scale-[1.02] cursor-pointer"
                        >{t("ctManageProfile")}</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>
        </Card>

        <Dialog
          open={showCreateModal}
          onClose={() => !creating && setShowCreateModal(false)}
          title={t("ctRegisterCompanyTitle")}
          description={t("ctRegisterCompanyDesc")}
          maxWidth="lg"
          className="nf-company-config"
        >
            <form onSubmit={handleCreateCompany} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t("ctCompanyCode")} htmlFor="create-company-code" required>
                  <Input
                    id="create-company-code"
                    placeholder="UNIQUE_CODE"
                    value={createForm.company_code}
                    onChange={(e) => setCreateForm({ ...createForm, company_code: e.target.value })}
                    required
                  />
                </Field>
                <Field label={t("ctLegalEntityName")} htmlFor="create-company-name" required>
                  <Input
                    id="create-company-name"
                    placeholder={t("ctPhCompanyPvtLtd")}
                    value={createForm.company_name}
                    onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                    required
                  />
                </Field>
                <Field label={t("coFieldDisplayName")} htmlFor="create-company-display-name">
                  <Input
                    id="create-company-display-name"
                    placeholder={t("ctPhBrandName")}
                    value={createForm.company_display_name}
                    onChange={(e) => setCreateForm({ ...createForm, company_display_name: e.target.value })}
                  />
                </Field>
                <div className="flex flex-col gap-1.5">
                  <label className="nf-text-label text-(--text-secondary)">{t("ctClassification")}</label>
                  <Select
                    value={createForm.company_type}
                    onChange={(e) => setCreateForm({ ...createForm, company_type: e.target.value })}
                  >
                    <option value="Pvt Ltd">{t("ctClsPvtLtd")}</option>
                    <option value="Sole Proprietor">{t("ctClsSoleProprietor")}</option>
                    <option value="Partnership">{t("ctClsPartnership")}</option>
                    <option value="LLP">LLP</option>
                    <option value="Trust">{t("ctClsTrust")}</option>
                    <option value="Co-operative">{t("ctClsCooperative")}</option>
                  </Select>
                </div>
                <Field label={t("ctPrimaryIndustry")} htmlFor="create-industry-type" required>
                  <Input
                    id="create-industry-type"
                    placeholder={t("coIndustryPoultryFarming")}
                    value={createForm.industry_type}
                    onChange={(e) => setCreateForm({ ...createForm, industry_type: e.target.value })}
                    required
                  />
                </Field>
                <Field label={t("ctOperatingCountry")} htmlFor="create-country-id">
                  <Input
                    id="create-country-id"
                    placeholder="IND"
                    value={createForm.country_id}
                    onChange={(e) => setCreateForm({ ...createForm, country_id: e.target.value })}
                  />
                </Field>
                <Field label={t("ctTimezone")} htmlFor="create-timezone">
                  <Input
                    id="create-timezone"
                    placeholder="Asia/Kolkata"
                    value={createForm.default_timezone_id}
                    onChange={(e) => setCreateForm({ ...createForm, default_timezone_id: e.target.value })}
                  />
                </Field>
                <Field label={t("ctTaxRegIdShort")} htmlFor="create-tax-id">
                  <Input
                    id="create-tax-id"
                    placeholder="GSTIN12345"
                    value={createForm.tax_id}
                    onChange={(e) => setCreateForm({ ...createForm, tax_id: e.target.value })}
                  />
                </Field>
                <Field label={t("ctCorpRegNoShort")} htmlFor="create-registration-no">
                  <Input
                    id="create-registration-no"
                    placeholder="CIN12345"
                    value={createForm.registration_no}
                    onChange={(e) => setCreateForm({ ...createForm, registration_no: e.target.value })}
                  />
                </Field>
                <div className="flex flex-col gap-1.5">
                  <label className="nf-text-label text-(--text-secondary)">{t("ctBrandHexColor")}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={createForm.primary_color_hex}
                      onChange={(e) => setCreateForm({ ...createForm, primary_color_hex: e.target.value })}
                      className="w-12 h-12 rounded-[var(--radius-sm)] bg-transparent border-0 cursor-pointer"
                    />
                    <Input
                      value={createForm.primary_color_hex}
                      onChange={(e) => setCreateForm({ ...createForm, primary_color_hex: e.target.value })}
                      className="flex-1"
                      placeholder="#1F4E79"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-(--border) pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={creating} onClick={() => setShowCreateModal(false)} className="min-h-10 px-4 text-sm cursor-pointer">{t("cancel")}</Button>
                <Button type="submit" disabled={creating} className="min-h-10 px-5 text-sm cursor-pointer">
                  {creating ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </form>
        </Dialog>

      </div>
    );
  }

  // Render Details View (Tenant Admin managing details, or Company Admin viewing their own details)
  const currentLogoUrl = setupDetails?.company?.company_logo_url || targetCompany?.company_logo_url || "";

  return (
    <div className="flex w-full flex-col gap-4 animate-fade-in">

      {/* Feedback stays in the content flow so it never covers card actions. */}
      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 border-(--danger) bg-(--danger-muted) text-(--danger)">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 border-(--success) bg-(--success-muted) text-(--success)">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Header back button for Tenant Admin */}
      {isTenantAdmin && !skipDirectory && (
        <button
          onClick={() => setSelectedCompanyDetails(null)}
          className="flex items-center gap-2 text-xs text-(--text-secondary) hover:text-(--text-primary) cursor-pointer w-fit font-semibold bg-(--surface-raised) py-2 px-4 rounded-[var(--radius-sm)] border border-(--border) transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />{t("ctBackToDirectory")}</button>
      )}

      <div className="company-settings-container grid grid-cols-1 items-start gap-4 lg:grid-cols-12">

        {/* Left Column Settings (Configuring all 8 wizard steps) */}
        <div className="flex flex-col gap-4 lg:col-span-8">

          {/* Settings details card */}
          <FullPageDialogBoundary open={isEditing} onClose={() => setIsEditing(false)} className="max-w-[980px]">
          <Card role={isEditing ? "dialog" : undefined} aria-modal={isEditing ? true : undefined} className={`nf-company-config flex flex-col gap-5 border-(--border) bg-(--surface) p-5 ${isEditing ? "max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:max-h-[calc(100dvh-3rem)]" : ""}`}>
            <div className="flex justify-between items-center border-b border-(--border) pb-4">
              <div>
                <h3 className="text-sm font-semibold text-(--text-primary)">{t("ctErpSetupConfig")}</h3>
                {targetCompany && (
                  <span className="text-[9px] text-(--text-secondary) font-mono font-semibold bg-(--surface-raised) px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-(--border) mt-1 block w-fit">{targetCompany.company_id}</span>
                )}
              </div>

              {/* Edit button allowed for Tenant Admin & Company Admin */}
              {canEditCompany && (
                <div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface) px-4 text-xs font-semibold text-(--accent) transition hover:bg-(--accent-muted)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />{t("ctEditConfiguration")}</button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1 text-xs text-(--text-secondary) hover:text-(--text-primary) font-semibold bg-(--surface-raised) py-1.5 px-3 rounded-lg border border-(--border) cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />{t("ctCloseEditor")}</button>
                  )}
                </div>
              )}
            </div>

            {setupLoadWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-(--warning) bg-(--warning-muted) px-3 py-2.5 text-xs leading-5 text-(--warning)">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{setupLoadWarning}</span>
              </div>
            )}

            {!targetCompany ? (
              <div className="text-center p-8 text-(--text-secondary)">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-(--accent)" />
                <p className="text-xs">{t("ctNoActiveProfile")}</p>
              </div>
            ) : loadingDetails ? (
              <div className="text-xs text-(--text-secondary) text-center py-12 animate-pulse">{t("ctLoadingSteps")}</div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Tab Selector Sidebar inside Settings card */}
                <div className="flex flex-row md:flex-col gap-1 w-full md:w-52 overflow-x-auto shrink-0 pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-(--border) pr-0 md:pr-4">
                  <button
                    type="button"
                    onClick={() => setSettingsTab("profile")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "profile"
                        ? "bg-(--accent)/10 text-(--text-primary) border-l-2 border-(--accent)"
                        : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-raised)"
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />{t("ctStep1Profile")}</button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("address")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "address"
                        ? "bg-(--accent)/10 text-(--text-primary) border-l-2 border-(--accent)"
                        : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-raised)"
                    }`}
                  >
                    <MapPin className="w-4 h-4 shrink-0" />{t("ctStep2Address")}</button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("contact")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "contact"
                        ? "bg-(--accent)/10 text-(--text-primary) border-l-2 border-(--accent)"
                        : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-raised)"
                    }`}
                  >
                    <Contact className="w-4 h-4 shrink-0" />{t("ctStep3Contact")}</button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("localization")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "localization"
                        ? "bg-(--accent)/10 text-(--text-primary) border-l-2 border-(--accent)"
                        : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-raised)"
                    }`}
                  >
                    <Globe className="w-4 h-4 shrink-0" />{t("ctStep456Locale")}</button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("fiscal")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "fiscal"
                        ? "bg-(--accent)/10 text-(--text-primary) border-l-2 border-(--accent)"
                        : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-raised)"
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />{t("ctStep7Fiscal")}</button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("modules")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "modules"
                        ? "bg-(--accent)/10 text-(--text-primary) border-l-2 border-(--accent)"
                        : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-raised)"
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />{t("ctStep8Sectors")}</button>
                </div>

                {/* Tab content body */}
                <div className="flex-1 w-full min-w-0">

                  {/* profile TAB */}
                  {settingsTab === "profile" && (
                    !isEditing ? (
                      <div className="flex flex-col gap-6">
                        {/* Logo & Header Card */}
                        <div className="p-4 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface-raised) flex items-center gap-4">
                          <div className="w-16 h-16 rounded-[var(--radius-sm)] border border-(--border) bg-(--input-bg) flex items-center justify-center overflow-hidden shrink-0">
                            {currentLogoUrl ? (
                              <img
                                src={currentLogoUrl.startsWith('/') ? `${backendUrl}${currentLogoUrl}` : currentLogoUrl}
                                alt={t("ctCompanyLogoAlt")}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-(--text-muted)" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-(--text-primary)">{setupDetails?.company?.company_name || targetCompany?.company_name}</span>
                            <span className="text-xs text-(--text-secondary) font-mono">{setupDetails?.company?.company_code || targetCompany?.company_code} • {setupDetails?.company?.company_type || targetCompany?.company_type}</span>
                            {setupDetails?.company?.website && (
                              <a href={setupDetails.company.website} target="_blank" rel="noreferrer" className="text-xs text-(--accent) hover:underline">
                                {setupDetails.company.website}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctCompanyCode")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-1 font-mono bg-(--surface-raised) border border-(--border) px-3 py-1.5 rounded-[var(--radius-sm)] w-fit">
                              {setupDetails?.company?.company_code || targetCompany?.company_code}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctLegalEntityName")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.company?.company_name || targetCompany?.company_name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("coFieldDisplayName")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.company?.company_display_name || targetCompany?.company_display_name || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctBusinessClassification")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.company?.company_type || targetCompany?.company_type || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctPrimaryIndustry")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.company?.industry_type || targetCompany?.industry_type || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctTaxRegIdFull")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-1 font-mono bg-(--surface-raised) border border-(--border) px-3 py-1.5 rounded-[var(--radius-sm)] w-fit">
                              {setupDetails?.company?.tax_id || targetCompany?.tax_id || "—"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctTaxRegimeScheme")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.company?.tax_regime || "STANDARD"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctCorpRegNoFull")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-1.5 font-mono bg-(--surface-raised) border border-(--border) px-3 py-1.5 rounded-[var(--radius-sm)] w-fit">
                              {setupDetails?.company?.registration_no || targetCompany?.registration_no || "—"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctIncorporationDate")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.company?.incorporation_date || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctOfficialWebsite")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.company?.website || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctAutoVerifyDomain")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.company?.email_domain || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctSupportEmail")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.company?.support_email || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctPrimaryPhoneLandline")}</span>
                            <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.company?.phone_primary || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="nf-text-label text-(--text-secondary)">{t("ctPrimaryAccentColor")}</span>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-5 h-5 rounded-lg border border-(--border)" style={{ backgroundColor: setupDetails?.company?.primary_color_hex || targetCompany?.primary_color_hex || "#1F4E79" }} />
                              <span className="text-xs font-mono text-(--text-secondary) uppercase">{setupDetails?.company?.primary_color_hex || targetCompany?.primary_color_hex || "#1F4E79"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        {/* Logo Upload Section */}
                        <div className="p-4 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface-raised) flex flex-col sm:flex-row items-center gap-4">
                          <div className="w-16 h-16 rounded-[var(--radius-sm)] border border-dashed border-(--border) bg-(--input-bg) flex items-center justify-center overflow-hidden shrink-0">
                            {profileForm.company_logo_url ? (
                              <img
                                src={profileForm.company_logo_url.startsWith('/') ? `${backendUrl}${profileForm.company_logo_url}` : profileForm.company_logo_url}
                                alt={t("ctLogoPreviewAlt")}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-(--text-muted)" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-semibold text-(--text-secondary)">{t("ctCompanyLogoImage")}</label>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--accent)/10 text-(--accent) border border-(--accent)/30 text-xs font-semibold hover:bg-(--accent)/20 transition-all w-fit">
                              <Upload className="w-3.5 h-3.5" />
                              {uploadingLogo ? "Uploading..." : profileForm.company_logo_url ? "Change Logo" : "Upload Logo"}
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                onChange={handleLogoUpload}
                                disabled={uploadingLogo}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label={t("ctCompanyCodeReadOnly")} htmlFor="profile-company-code">
                            <Input
                              id="profile-company-code"
                              value={profileForm.company_code}
                              disabled
                              className="opacity-50"
                            />
                          </Field>
                          <Field label={t("ctLegalEntityName")} htmlFor="profile-company-name" required>
                            <Input
                              id="profile-company-name"
                              value={profileForm.company_name}
                              onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("coFieldDisplayName")} htmlFor="profile-company-display-name">
                            <Input
                              id="profile-company-display-name"
                              value={profileForm.company_display_name}
                              onChange={(e) => setProfileForm({ ...profileForm, company_display_name: e.target.value })}
                            />
                          </Field>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctClassification")}</label>
                            <Select
                              value={profileForm.company_type}
                              onChange={(e) => setProfileForm({ ...profileForm, company_type: e.target.value })}
                            >
                              <option value="Sole Proprietor">{t("ctClsSoleProprietor")}</option>
                              <option value="Partnership">{t("ctClsPartnership")}</option>
                              <option value="Pvt Ltd">{t("ctClsPvtLtd")}</option>
                              <option value="LLP">LLP</option>
                              <option value="Trust">{t("ctClsTrust")}</option>
                              <option value="Co-operative">{t("ctClsCooperative")}</option>
                            </Select>
                          </div>
                          <Field label={t("ctPrimaryIndustry")} htmlFor="profile-industry-type" required>
                            <Input
                              id="profile-industry-type"
                              value={profileForm.industry_type}
                              onChange={(e) => setProfileForm({ ...profileForm, industry_type: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("ctTaxRegIdShort")} htmlFor="profile-tax-id">
                            <Input
                              id="profile-tax-id"
                              value={profileForm.tax_id}
                              onChange={(e) => setProfileForm({ ...profileForm, tax_id: e.target.value })}
                            />
                          </Field>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctTaxRegime")}</label>
                            <Select
                              value={profileForm.tax_regime}
                              onChange={(e) => setProfileForm({ ...profileForm, tax_regime: e.target.value })}
                            >
                              <option value="STANDARD">{t("ctSchemeStandard")}</option>
                              <option value="COMPOSITION">{t("ctSchemeComposition")}</option>
                              <option value="EXEMPT">{t("ctSchemeExempt")}</option>
                            </Select>
                          </div>
                          <Field label={t("ctCorpRegNoShort")} htmlFor="profile-registration-no">
                            <Input
                              id="profile-registration-no"
                              value={profileForm.registration_no}
                              onChange={(e) => setProfileForm({ ...profileForm, registration_no: e.target.value })}
                            />
                          </Field>
                          <Field label={t("ctIncorporationDate")} htmlFor="profile-incorporation-date">
                            <Input
                              id="profile-incorporation-date"
                              type="date"
                              value={profileForm.incorporation_date}
                              onChange={(e) => setProfileForm({ ...profileForm, incorporation_date: e.target.value })}
                            />
                          </Field>
                          <Field label={t("ctWebsiteUrl")} htmlFor="profile-website">
                            <Input
                              id="profile-website"
                              placeholder="https://greenvalleyfarms.in"
                              value={profileForm.website}
                              onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                            />
                          </Field>
                          <Field label={t("ctEmailDomainAutoVerify")} htmlFor="profile-email-domain">
                            <Input
                              id="profile-email-domain"
                              placeholder="greenvalleyfarms.in"
                              value={profileForm.email_domain}
                              onChange={(e) => setProfileForm({ ...profileForm, email_domain: e.target.value })}
                            />
                          </Field>
                          <Field label={t("ctSupportEmail")} htmlFor="profile-support-email">
                            <Input
                              id="profile-support-email"
                              placeholder="support@greenvalleyfarms.in"
                              type="email"
                              value={profileForm.support_email}
                              onChange={(e) => setProfileForm({ ...profileForm, support_email: e.target.value })}
                            />
                          </Field>
                          <Field label={t("ctPrimaryPhoneLandline")} htmlFor="profile-phone-primary">
                            <Input
                              id="profile-phone-primary"
                              placeholder="+91 11 2345 6789"
                              value={profileForm.phone_primary}
                              onChange={(e) => setProfileForm({ ...profileForm, phone_primary: e.target.value })}
                            />
                          </Field>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctBrandHexColor")}</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={profileForm.primary_color_hex}
                                onChange={(e) => setProfileForm({ ...profileForm, primary_color_hex: e.target.value })}
                                className="w-12 h-12 rounded-[var(--radius-sm)] bg-transparent border-0 cursor-pointer"
                              />
                              <Input
                                value={profileForm.primary_color_hex}
                                onChange={(e) => setProfileForm({ ...profileForm, primary_color_hex: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        <Button type="submit" disabled={saving || uploadingLogo} className="mt-4 self-end flex items-center gap-2 cursor-pointer text-xs">
                          <Save className="w-4 h-4" /> {saving ? "Saving changes..." : "Save Step 1 Profile Settings"}
                        </Button>
                      </form>
                    )
                  )}


                  {/* address TAB */}
                  {settingsTab === "address" && (
                    !isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctAddressLabelTag")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.address?.address_label || "Primary HQ"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctAddressType")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.address?.address_type || "HQ"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctAddressLine1")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.address?.line1 || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctAddressLine2")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.address?.line2 || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctCity")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.address?.city || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctStateProvince")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.address?.state_id || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctCountryCode")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.address?.country_id || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctPincodePostal")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.address?.pincode || "—"}</span>
                        </div>
                        <div className="flex flex-col sm:col-span-2">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctGpsCoordinates")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">
                            {setupDetails?.address?.gps_latitude && setupDetails?.address?.gps_longitude
                              ? `${setupDetails.address.gps_latitude}, ${setupDetails.address.gps_longitude}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label={t("ctAddressNicknameTag")} htmlFor="address-label">
                            <Input
                              id="address-label"
                              placeholder={t("ctPhHeadquartersGate")}
                              value={addressForm.address_label}
                              onChange={(e) => setAddressForm({ ...addressForm, address_label: e.target.value })}
                            />
                          </Field>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctAddressType")}</label>
                            <Select
                              value={addressForm.address_type}
                              onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}
                            >
                              <option value="HQ">{t("ctAddrCorporateHq")}</option>
                              <option value="Branch">{t("ctAddrBranchOffice")}</option>
                              <option value="Warehouse">{t("ctAddrWarehouseDepot")}</option>
                              <option value="Farm">{t("ctAddrFarmSite")}</option>
                            </Select>
                          </div>
                          <Field label={t("ctAddressLine1")} htmlFor="address-line1" required>
                            <Input
                              id="address-line1"
                              value={addressForm.line1}
                              onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("ctAddressLine2")} htmlFor="address-line2">
                            <Input
                              id="address-line2"
                              value={addressForm.line2}
                              onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                            />
                          </Field>
                          <Field label={t("ctCity")} htmlFor="address-city" required>
                            <Input
                              id="address-city"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("ctStateProvince")} htmlFor="address-state" required>
                            <Input
                              id="address-state"
                              value={addressForm.state_id}
                              onChange={(e) => setAddressForm({ ...addressForm, state_id: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("country")} htmlFor="address-country" required>
                            <Input
                              id="address-country"
                              value={addressForm.country_id}
                              onChange={(e) => setAddressForm({ ...addressForm, country_id: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("ctPincode")} htmlFor="address-pincode" required>
                            <Input
                              id="address-pincode"
                              value={addressForm.pincode}
                              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                              required
                            />
                          </Field>
                          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                            <Field label={t("ctGpsLatitude")} htmlFor="address-gps-lat">
                              <Input
                                id="address-gps-lat"
                                placeholder={t("ctPhLatitude")}
                                value={addressForm.gps_latitude}
                                onChange={(e) => setAddressForm({ ...addressForm, gps_latitude: e.target.value })}
                              />
                            </Field>
                            <Field label={t("ctGpsLongitude")} htmlFor="address-gps-lng">
                              <Input
                                id="address-gps-lng"
                                placeholder={t("ctPhLongitude")}
                                value={addressForm.gps_longitude}
                                onChange={(e) => setAddressForm({ ...addressForm, gps_longitude: e.target.value })}
                              />
                            </Field>
                          </div>
                        </div>
                        <Button type="submit" disabled={saving} className="mt-4 self-end flex items-center gap-2 cursor-pointer text-xs">
                          <Save className="w-4 h-4" /> {saving ? "Saving changes..." : "Save Step 2 Address"}
                        </Button>
                      </form>
                    )
                  )}

                  {/* contact TAB */}
                  {settingsTab === "contact" && (
                    !isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctContactPersonName")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.contact?.full_name || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("profileDesignation")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.contact?.designation || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctPrimaryPhone")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.contact?.phone_primary || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctSecondaryPhone")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.contact?.phone_secondary || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctPrimaryEmail")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.contact?.email || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctAlertEmails")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">
                            {setupDetails?.contact?.receives_alerts ? "Active - Receives ERP threshold notifications" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex flex-col sm:col-span-2">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctExecReportEmails")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">
                            {setupDetails?.contact?.receives_reports ? "Active - Receives periodic executive summary reports" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label={t("ctKeyContactFullName")} htmlFor="contact-full-name" required>
                            <Input
                              id="contact-full-name"
                              value={contactForm.full_name}
                              onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("ctDesignationRole")} htmlFor="contact-designation" required>
                            <Input
                              id="contact-designation"
                              value={contactForm.designation}
                              onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("ctPrimaryContactPhone")} htmlFor="contact-phone-primary" required>
                            <Input
                              id="contact-phone-primary"
                              value={contactForm.phone_primary}
                              onChange={(e) => setContactForm({ ...contactForm, phone_primary: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("ctSecondaryContactPhone")} htmlFor="contact-phone-secondary">
                            <Input
                              id="contact-phone-secondary"
                              value={contactForm.phone_secondary}
                              onChange={(e) => setContactForm({ ...contactForm, phone_secondary: e.target.value })}
                            />
                          </Field>
                          <Field label={t("ctPrimaryEmail")} htmlFor="contact-email" required>
                            <Input
                              id="contact-email"
                              type="email"
                              value={contactForm.email}
                              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                              required
                            />
                          </Field>
                          <div className="flex flex-col gap-2 justify-center pt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={contactForm.receives_alerts}
                                onChange={(e) => setContactForm({ ...contactForm, receives_alerts: e.target.checked })}
                                className="w-4 h-4 rounded-[var(--radius-xs)] border-(--border) bg-(--input-bg) text-(--accent) cursor-pointer"
                              />
                              <span className="text-(--text-secondary) font-medium">{t("ctReceiveThresholdAlerts")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={contactForm.receives_reports}
                                onChange={(e) => setContactForm({ ...contactForm, receives_reports: e.target.checked })}
                                className="w-4 h-4 rounded-[var(--radius-xs)] border-(--border) bg-(--input-bg) text-(--accent) cursor-pointer"
                              />
                              <span className="text-(--text-secondary) font-medium">{t("ctReceiveExecReports")}</span>
                            </label>
                          </div>
                        </div>
                        <Button type="submit" disabled={saving} className="mt-4 self-end flex items-center gap-2 cursor-pointer text-xs">
                          <Save className="w-4 h-4" /> {saving ? "Saving changes..." : "Save Step 3 Contact"}
                        </Button>
                      </form>
                    )
                  )}


                  {/* localization TAB */}
                  {settingsTab === "localization" && (
                    !isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctDefaultLanguage")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">
                            {languages.find(l => l.lang_id === setupDetails?.company?.default_language_id)?.lang_name || setupDetails?.company?.default_language_id || "—"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctBaseCurrency")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">
                            {currencies.find(c => c.currency_id === setupDetails?.company?.base_currency_id)?.currency_name || setupDetails?.company?.base_currency_id || "—"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctDefaultTimezone")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.company?.default_timezone_id || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctCountryLocaleCode")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.company?.country_id || "—"}</span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctDefaultLanguage")}</label>
                            <Select
                              value={localizationForm.default_language_id}
                              onChange={(e) => setLocalizationForm({ ...localizationForm, default_language_id: e.target.value })}
                            >
                              <option value="">{t("ctSelectLanguage")}</option>
                              {languages.map((l: any) => (
                                <option key={l.lang_id} value={l.lang_id}>{l.lang_name} ({l.lang_code})</option>
                              ))}
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctBaseCurrency")}</label>
                            <Select
                              value={localizationForm.base_currency_id}
                              onChange={(e) => setLocalizationForm({ ...localizationForm, base_currency_id: e.target.value })}
                            >
                              <option value="">{t("ctSelectCurrency")}</option>
                              {currencies.map((c: any) => (
                                <option key={c.currency_id} value={c.currency_id}>{c.currency_name} ({c.currency_code})</option>
                              ))}
                            </Select>
                          </div>
                          <Field label={t("ctTimezoneId")} htmlFor="localization-timezone" required>
                            <Input
                              id="localization-timezone"
                              value={localizationForm.default_timezone_id}
                              onChange={(e) => setLocalizationForm({ ...localizationForm, default_timezone_id: e.target.value })}
                              required
                            />
                          </Field>
                          <Field label={t("ctOperatingCountryCode")} htmlFor="localization-country" required>
                            <Input
                              id="localization-country"
                              value={localizationForm.country_id}
                              onChange={(e) => setLocalizationForm({ ...localizationForm, country_id: e.target.value.toUpperCase() })}
                              required
                            />
                          </Field>
                        </div>
                        <Button type="submit" disabled={saving} className="mt-4 self-end flex items-center gap-2 cursor-pointer text-xs">
                          <Save className="w-4 h-4" /> {saving ? "Saving changes..." : "Save Localization"}
                        </Button>
                      </form>
                    )
                  )}

                  {/* fiscal TAB */}
                  {settingsTab === "fiscal" && (
                    !isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctFiscalYearFormat")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.fiscal?.fiscal_year_format || "FY APR-MAR"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctFiscalStartMonthDay")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">
                            {setupDetails?.fiscal?.fiscal_start_month ? `Month ${setupDetails.fiscal.fiscal_start_month}` : "Month 4 (April)"} (Day {setupDetails?.fiscal?.fiscal_start_day || 1} to Day {setupDetails?.fiscal?.fiscal_end_day || 31})
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctCurrentFiscalYear")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.fiscal?.current_fiscal_year || "2026-27"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctPeriodType")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.fiscal?.period_type || "MONTHLY"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctAccountingStandard")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.fiscal?.accounting_standard || "Local GAAP"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctDepreciationModel")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.fiscal?.depreciation_method || "SLM (Straight Line)"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctInventoryCostingModel")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.fiscal?.inventory_valuation || "FIFO"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctTaxFilingFrequency")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">{setupDetails?.fiscal?.gst_filing_frequency || "MONTHLY"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctStatutoryTaxAudit")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2">
                            {setupDetails?.fiscal?.tax_audit_applicable ? "Mandatory Tax Audit Applicable" : "Not Applicable"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="nf-text-label text-(--text-secondary)">{t("ctDecimalPrecision")}</span>
                          <span className="text-xs font-semibold text-(--text-primary) mt-2 font-mono">{setupDetails?.fiscal?.decimal_places ?? 2} Decimal Places</span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctFiscalStartMonth")}</label>
                            <Select
                              value={fiscalForm.fiscal_start_month}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, fiscal_start_month: parseInt(e.target.value) })}
                            >
                              <option value={1}>{t("ctMonthJanuary")}</option>
                              <option value={4}>{t("ctMonthApril")}</option>
                            </Select>
                          </div>
                          <Field label={t("ctCurrentFiscalYear")} htmlFor="fiscal-year" required>
                            <Input
                              id="fiscal-year"
                              placeholder={t("ctPhFiscalYear")}
                              value={fiscalForm.current_fiscal_year}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, current_fiscal_year: e.target.value })}
                              required
                            />
                          </Field>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctAccountingPeriodicity")}</label>
                            <Select
                              value={fiscalForm.period_type}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, period_type: e.target.value })}
                            >
                              <option value="MONTHLY">{t("ctPeriodMonthly")}</option>
                              <option value="QUARTERLY">{t("ctPeriodQuarterly")}</option>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctAccountingStandard")}</label>
                            <Select
                              value={fiscalForm.accounting_standard}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, accounting_standard: e.target.value })}
                            >
                              <option value="Local GAAP">{t("ctLocalGaap")}</option>
                              <option value="IFRS">IFRS</option>
                              <option value="US GAAP">US GAAP</option>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctDepreciationModel")}</label>
                            <Select
                              value={fiscalForm.depreciation_method}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, depreciation_method: e.target.value })}
                            >
                              <option value="SLM">{t("ctDeprSlm")}</option>
                              <option value="WDV">{t("ctDeprWdv")}</option>
                              <option value="UNITS_OF_PRODUCTION">{t("ctDeprUnitsOfProduction")}</option>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctInventoryCostingMethod")}</label>
                            <Select
                              value={fiscalForm.inventory_valuation}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, inventory_valuation: e.target.value })}
                            >
                              <option value="FIFO">{t("ctCostFifo")}</option>
                              <option value="Weighted Average">{t("ctCostWeightedAverage")}</option>
                              <option value="STANDARD COSTING">{t("ctCostStandard")}</option>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctTaxFilingFrequency")}</label>
                            <Select
                              value={fiscalForm.gst_filing_frequency}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, gst_filing_frequency: e.target.value })}
                            >
                              <option value="MONTHLY">{t("ctFilingMonthly")}</option>
                              <option value="QUARTERLY">{t("ctFilingQuarterly")}</option>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="nf-text-label text-(--text-secondary)">{t("ctDecimalPrecision")}</label>
                            <Select
                              value={fiscalForm.decimal_places}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, decimal_places: parseInt(e.target.value) })}
                            >
                              <option value={2}>2 Decimal Places (0.00)</option>
                              <option value={3}>3 Decimal Places (0.000)</option>
                              <option value={4}>4 Decimal Places (0.0000)</option>
                            </Select>
                          </div>
                          <div className="flex flex-col justify-center pt-2 sm:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={fiscalForm.tax_audit_applicable}
                                onChange={(e) => setFiscalForm({ ...fiscalForm, tax_audit_applicable: e.target.checked })}
                                className="w-4 h-4 rounded-[var(--radius-xs)] border-(--border) bg-(--input-bg) text-(--accent) cursor-pointer"
                              />
                              <span className="text-(--text-secondary) font-medium">{t("ctStatutoryAuditApplicable")}</span>
                            </label>
                          </div>
                        </div>
                        <Button type="submit" disabled={saving} className="mt-4 self-end flex items-center gap-2 cursor-pointer text-xs">
                          <Save className="w-4 h-4" /> {saving ? "Saving changes..." : "Save Fiscal Configurations"}
                        </Button>
                      </form>
                    )
                  )}


                  {/* modules TAB */}
                  {settingsTab === "modules" && (
                    !isEditing ? (
                      <div className="flex flex-col gap-4">
                        <span className="nf-text-label text-(--text-secondary)">{t("ctActivatedSectors")}</span>
                        {modulesForm.length === 0 ? (
                          <div className="text-xs text-(--text-secondary) bg-(--surface-raised) p-4 rounded-[var(--radius-sm)] border border-(--border)">{t("ctNoModulesEnabled")}</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {nobs.map((n: any) => {
                              const isNobActive = modulesForm.includes(n.nob_code);
                              if (!isNobActive) return null;

                              const associatedLobs = lobMap[n.nob_id] || [];
                              const activeLobs = associatedLobs.filter(l => modulesForm.includes(l.lob_code));

                              return (
                                <div key={n.nob_id} className="p-4 rounded-[var(--radius-sm)] bg-(--surface-raised) border border-(--border) flex flex-col gap-2">
                                  <div className="flex items-center gap-2 border-b border-(--border) pb-2">
                                    <span className="font-semibold text-xs text-(--text-primary)">{n.nob_name}</span>
                                    <span className="text-[9px] bg-(--accent)/10 text-(--accent) font-semibold border border-(--accent)/20 px-1.5 py-0.5 rounded-[var(--radius-xs)] font-mono uppercase shrink-0">{t("statusActive")}</span>
                                  </div>
                                  <div className="flex flex-col gap-1 mt-1">
                                    <span className="text-[9px] font-semibold text-(--accent) uppercase tracking-wider">{t("ctActiveLobsLabel")}</span>
                                    {activeLobs.length === 0 ? (
                                      <span className="text-xs text-(--text-secondary)">{t("ctNoneActive")}</span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {activeLobs.map(lob => (
                                          <span key={lob.lob_id} className="text-[10px] text-(--text-secondary) bg-(--surface-raised) px-2 py-0.5 rounded-[var(--radius-xs)] border border-(--border)">{lob.lob_name}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {nobs.map((n: any) => {
                            const isNobChecked = modulesForm.includes(n.nob_code);
                            const associatedLobs = lobMap[n.nob_id] || [];

                            return (
                              <div
                                key={n.nob_id}
                                onClick={() => handleNobToggle(n.nob_code, n.nob_id)}
                                className={`p-4 border rounded-[var(--radius-md)] flex flex-col gap-2 cursor-pointer transition-all ${
                                  isNobChecked
                                    ? "border-(--accent)/40 bg-(--accent)/5"
                                    : "border-(--border) bg-(--surface-raised) hover:border-(--accent)"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-sm text-(--text-primary)">{n.nob_name}</span>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    isNobChecked ? "bg-(--accent) border-(--accent) text-white" : "border-(--border)"
                                  }`}>
                                    {isNobChecked && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                </div>
                                <p className="text-xs text-(--text-secondary)">{n.description || "Link this sector to enable daily feed logs and batches."}</p>

                                {/* LOB Checkboxes inside setup view */}
                                {isNobChecked && (
                                  <div className="mt-3 pt-3 border-t border-(--border)/80 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[10px] font-semibold text-(--accent) uppercase tracking-wider">{t("ctSelectActiveLobs")}</span>
                                    {loadingLobs[n.nob_id] ? (
                                      <div className="text-[11px] text-(--text-secondary) animate-pulse py-1">{t("ctLoadingSubSectors")}</div>
                                    ) : associatedLobs.length === 0 ? (
                                      <div className="text-[11px] text-(--text-secondary) py-1">{t("ctNoSubSectors")}</div>
                                    ) : (
                                      <div className="flex flex-col gap-1.5 mt-1">
                                        {associatedLobs.map((lob: any) => {
                                          const isLobChecked = modulesForm.includes(lob.lob_code);
                                          return (
                                            <label
                                              key={lob.lob_id}
                                              className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-(--surface-raised) text-xs transition-colors"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isLobChecked}
                                                onChange={() => handleLobToggle(lob.lob_code)}
                                                className="w-4 h-4 rounded-[var(--radius-xs)] border-(--input-border) bg-(--input-bg) text-(--accent) focus:ring-(--accent) focus:ring-offset-0 focus:ring-0 cursor-pointer"
                                              />
                                              <div className="flex flex-col">
                                                <span className="font-semibold text-(--text-primary)">{lob.lob_name}</span>
                                                {lob.description && <span className="text-[10px] text-(--text-secondary)">{lob.description}</span>}
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <Button onClick={handleSaveModules} disabled={saving} className="mt-6 self-end flex items-center gap-2 cursor-pointer text-xs">
                          <Save className="w-4 h-4" /> {saving ? "Saving Changes..." : "Save Business Verticals"}
                        </Button>
                      </div>
                    )
                  )}

                </div>
              </div>
            )}
          </Card>
          </FullPageDialogBoundary>

          {/* Details footer stats */}
          <Card className="nf-company-config flex flex-col gap-4 border-(--border) bg-(--surface) p-6">
            <h4 className="text-sm font-semibold text-(--text-primary)">{t("ctTenantConfigSummary")}</h4>
            {targetCompany ? (
              <div className="text-xs text-(--text-secondary) flex flex-col gap-4">
                <div className="flex justify-between items-center py-2 border-b border-(--border)">
                  <span className="text-(--text-secondary) font-medium">{t("ctBaseCurrency")}</span>
                  <span className="text-(--text-primary) font-semibold font-mono bg-(--surface-raised) px-2 py-0.5 rounded-[var(--radius-xs)] border border-(--border)">
                    {currencies.find(c => c.currency_id === targetCompany?.base_currency_id)?.currency_name || "INR"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-(--border)">
                  <span className="text-(--text-secondary) font-medium">{t("ctTimezone")}</span>
                  <span className="text-(--text-primary) font-semibold">{targetCompany?.default_timezone_id || "Asia/Kolkata"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-(--border)">
                  <span className="text-(--text-secondary) font-medium">{t("ctOperatingCountry")}</span>
                  <span className="text-(--text-primary) font-semibold font-mono bg-(--surface-raised) px-2 py-0.5 rounded-[var(--radius-xs)] border border-(--border)">
                    {targetCompany?.country_id || "IND"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-(--text-secondary) font-medium">{t("ctOnboardingStatus")}</span>
                  <span className={`px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-semibold ${
                    targetCompany?.onboarding_status === 'COMPLETED' ? 'bg-(--success-muted) text-(--success) border border-(--success)' : 'bg-(--warning-muted) text-(--warning) border border-(--warning)'
                  }`}>
                    {targetCompany?.onboarding_status || 'PENDING'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-(--text-secondary)">{t("ctNoCompanySelected")}</div>
            )}
          </Card>

        </div>

        {/* Right Column: Manage Users */}
        <div className="flex flex-col gap-4 lg:col-span-4">

          {/* User list card */}
          <Card className="nf-company-config border-(--border) bg-(--surface) p-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-(--border) pb-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)"><Users className="h-4 w-4 text-(--accent)" />{isTenantAdmin ? "Company administrators" : "Company operators"}</h4>
              <button type="button" onClick={() => setShowAdminDialog(true)} className="nf-primary-action flex h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold text-white transition hover:opacity-90"><UserPlus size={14} /> Add</button>
            </div>

            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
              {loadingUsers ? (
                <div className="text-xs text-(--text-secondary) text-center py-6">{t("ctLoadingTeam")}</div>
              ) : companyUsers.length === 0 ? (
                <div className="text-xs text-(--text-secondary) text-center py-6">{t("ctNoUsersAssigned")}</div>
              ) : (
                companyUsers.map((u) => {
                  const isSelf = !!currentUser?.userId && u.user_id === currentUser.userId;
                  return (
                  <button
                    key={u.user_id}
                    type="button"
                    onClick={() => setEditingOperator(u)}
                    className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface-raised) p-3 text-left transition hover:border-(--accent)"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-xs font-semibold text-(--text-primary)">
                        {u.full_name}
                        {isSelf && <span className="ml-1.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>YOU</span>}
                      </span>
                      <span className="truncate text-[10px] text-(--text-secondary)">{u.email}</span>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <ActiveStatusBadge isActive={u.is_active !== false} />
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r: any) => (
                            <Badge key={r.role_id} variant="accent">{r.role_name}</Badge>
                          ))
                        ) : (
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t("ctNoRoleAssigned")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        onClick={(e) => { e.stopPropagation(); setEditingOperator(u); }}
                        className="p-1.5 text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) rounded-lg cursor-pointer transition-colors"
                        title={t("ctViewEdit")}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </span>
                      {!isSelf && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setUserPendingDeletion(u.user_id); }}
                          className="p-1.5 text-(--text-secondary) hover:text-(--danger) hover:bg-(--danger-muted) rounded-lg cursor-pointer transition-colors"
                          title={t("ctDeactivateAccount")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                  );
                })
              )}
            </div>
          </Card>

          <Dialog
            open={showAdminDialog}
            onClose={() => setShowAdminDialog(false)}
            title={isTenantAdmin ? "Add company administrator" : "Add company operator"}
            description={`Create an account for ${targetCompany?.company_name ?? "this company"}.`}
            maxWidth="md"
            footer={
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAdminDialog(false)}>{t("cancel")}</Button>
                <Button type="submit" form="add-admin-form" disabled={addingAdmin} size="sm" className="flex items-center gap-1.5 nf-btn-primary">
                  <UserPlus className="w-3.5 h-3.5" /> {addingAdmin ? "Registering..." : (isTenantAdmin ? "Add Administrator" : "Add Operator")}
                </Button>
              </>
            }
          >
            <form id="add-admin-form" onSubmit={handleAddCompanyAdmin} className="flex flex-col gap-4 pt-1">
              <Field label={t("authFullName")} htmlFor="admin-full-name" required>
                <Input
                  id="admin-full-name"
                  placeholder={t("ctPhPersonName")}
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  required
                />
              </Field>
              <Field label={t("usrEmailAddress")} htmlFor="admin-email" required>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="user@domain.com"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                />
              </Field>
              <Field label={t("usrTempPassword")} htmlFor="admin-password" required>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder={t("ctPhMinEightChars")}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required
                />
              </Field>
              <Field label={t("ctPhoneNumber")} htmlFor="admin-phone">
                <Input
                  id="admin-phone"
                  placeholder="+919999911111"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                />
              </Field>
            </form>
          </Dialog>

          <Dialog
            open={Boolean(userPendingDeletion)}
            onClose={() => setUserPendingDeletion(null)}
            title={t("ctDeactivateAccount")}
            description={t("ctDeactivateWarning")}
            maxWidth="sm"
            footer={
              <>
                <Button variant="outline" size="sm" onClick={() => setUserPendingDeletion(null)}>{t("cancel")}</Button>
                <Button variant="destructive" size="sm" onClick={() => userPendingDeletion && handleDeleteUser(userPendingDeletion)}>{t("deactivate")}</Button>
              </>
            }
          >
            <p className="text-xs leading-5 text-(--text-secondary) pt-1">{t("ctConfirmDeactivate")}</p>
          </Dialog>

          {editingOperator && (
            <EditMemberModal
              member={editingOperator}
              roles={operatorRoles}
              isTenantAdmin={isTenantAdmin}
              allCompanies={companies}
              isSelf={!!currentUser?.userId && editingOperator.user_id === currentUser.userId}
              onClose={() => setEditingOperator(null)}
              onSaved={() => {
                setEditingOperator(null);
                if (targetCompany?.company_id) fetchCompanyUsers(targetCompany.company_id);
              }}
            />
          )}

        </div>

      </div>
    </div>
  );
}
