import React, { useState, useEffect } from "react";
import Card from "../../source-ui/card";
import Input from "../../source-ui/input";
import Button from "../../source-ui/button";
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
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="flex justify-between items-center bg-[#0b0f19] border border-[#1a1f2e] p-5 rounded-2xl">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-white text-base">Corporate Directory</h3>
            <p className="text-xs text-gray-500">Monitor and configure company business nodes under this SaaS tenant.</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 py-2.5 px-4 text-xs cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Add Company Node
          </Button>
        </div>

        <Card className="p-0 border-[#1a1f2e] bg-[#0b0f19] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1a1f2e] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-4 text-center w-12">#</th>
                  <th className="p-4 w-28">Code</th>
                  <th className="p-4">Company Name</th>
                  <th className="p-4 w-44">Industry</th>
                  <th className="p-4 w-48">Identifiers</th>
                  <th className="p-4 text-center w-28">Status</th>
                  <th className="p-4 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 text-xs">No corporate profiles registered. Click above to add one.</td>
                  </tr>
                ) : (
                  companies.map((comp, idx) => (
                    <tr key={comp.company_id} className="border-b border-[#1a1f2e] hover:bg-white/[0.02] text-xs transition-colors">
                      <td className="p-4 text-center text-gray-505 font-mono">{idx + 1}</td>
                      <td className="p-4">
                        <span className="font-mono text-white bg-[#121824] px-2 py-1 rounded border border-[#1a1f2e] font-semibold">{comp.company_code}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">{comp.company_name}</span>
                          <span className="text-[10px] text-gray-550">{comp.company_display_name || comp.company_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{comp.industry_type}</td>
                      <td className="p-4">
                        <div className="flex flex-col text-[10px] text-gray-400 font-mono gap-0.5">
                          <span>Tax: {comp.tax_id || "—"}</span>
                          <span>Reg: {comp.registration_no || "—"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          comp.onboarding_status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {comp.onboarding_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => {
                            setSelectedCompanyDetails(comp);
                            if (onSelectCompany) onSelectCompany(comp);
                          }}
                          className="py-1.5 px-3 text-[10px] uppercase font-bold tracking-wider hover:scale-[1.02] cursor-pointer"
                        >
                          Manage Profile
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog
          open={showCreateModal}
          onClose={() => !creating && setShowCreateModal(false)}
          title="Register new company"
          description="Create the company record. Detailed ERP setup continues after registration."
          maxWidth="lg"
          className="nf-company-config"
        >
            <form onSubmit={handleCreateCompany} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Code"
                  placeholder="UNIQUE_CODE"
                  value={createForm.company_code}
                  onChange={(e) => setCreateForm({ ...createForm, company_code: e.target.value })}
                  required
                />
                <Input
                  label="Legal Entity Name"
                  placeholder="Company Pvt Ltd"
                  value={createForm.company_name}
                  onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                  required
                />
                <Input
                  label="Display / Brand Name"
                  placeholder="Brand Name"
                  value={createForm.company_display_name}
                  onChange={(e) => setCreateForm({ ...createForm, company_display_name: e.target.value })}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Classification</label>
                  <select
                    value={createForm.company_type}
                    onChange={(e) => setCreateForm({ ...createForm, company_type: e.target.value })}
                    className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="Pvt Ltd">Pvt Ltd</option>
                    <option value="Sole Proprietor">Sole Proprietor</option>
                    <option value="Partnership">Partnership</option>
                    <option value="LLP">LLP</option>
                    <option value="Trust">Trust</option>
                    <option value="Co-operative">Co-operative</option>
                  </select>
                </div>
                <Input
                  label="Primary Industry"
                  placeholder="Poultry Farming"
                  value={createForm.industry_type}
                  onChange={(e) => setCreateForm({ ...createForm, industry_type: e.target.value })}
                  required
                />
                <Input
                  label="Operating Country"
                  placeholder="IND"
                  value={createForm.country_id}
                  onChange={(e) => setCreateForm({ ...createForm, country_id: e.target.value })}
                />
                <Input
                  label="Timezone"
                  placeholder="Asia/Kolkata"
                  value={createForm.default_timezone_id}
                  onChange={(e) => setCreateForm({ ...createForm, default_timezone_id: e.target.value })}
                />
                <Input
                  label="Tax Registration ID"
                  placeholder="GSTIN12345"
                  value={createForm.tax_id}
                  onChange={(e) => setCreateForm({ ...createForm, tax_id: e.target.value })}
                />
                <Input
                  label="Corporate Registration No"
                  placeholder="CIN12345"
                  value={createForm.registration_no}
                  onChange={(e) => setCreateForm({ ...createForm, registration_no: e.target.value })}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Brand Hex Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={createForm.primary_color_hex}
                      onChange={(e) => setCreateForm({ ...createForm, primary_color_hex: e.target.value })}
                      className="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer"
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

              <div className="flex flex-col-reverse gap-3 border-t border-[#e3e7ee] pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={creating} onClick={() => setShowCreateModal(false)} className="min-h-10 px-4 text-sm cursor-pointer">
                  Cancel
                </Button>
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
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Header back button for Tenant Admin */}
      {isTenantAdmin && !skipDirectory && (
        <button
          onClick={() => setSelectedCompanyDetails(null)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer w-fit font-bold bg-white/5 py-2 px-4 rounded-xl border border-[#1a1f2e] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace Directory
        </button>
      )}

      <div className="company-settings-container grid grid-cols-1 items-start gap-4 lg:grid-cols-12">

        {/* Left Column Settings (Configuring all 8 wizard steps) */}
        <div className="flex flex-col gap-4 lg:col-span-8">

          {/* Settings details card */}
          <FullPageDialogBoundary open={isEditing} onClose={() => setIsEditing(false)} className="max-w-[980px]">
          <Card role={isEditing ? "dialog" : undefined} aria-modal={isEditing ? true : undefined} className={`nf-company-config flex flex-col gap-5 border-[#e3e7ee] bg-white p-5 ${isEditing ? "max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:max-h-[calc(100dvh-3rem)]" : ""}`}>
            <div className="flex justify-between items-center border-b border-[#1a1f2e] pb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#2e313f]">ERP setup configuration</h3>
                {targetCompany && (
                  <span className="text-[9px] text-gray-500 font-mono font-semibold bg-[#121824] px-1.5 py-0.5 rounded border border-[#1a1f2e] mt-1 block w-fit">{targetCompany.company_id}</span>
                )}
              </div>

              {/* Edit button allowed for Tenant Admin & Company Admin */}
              {canEditCompany && (
                <div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex h-10 items-center gap-1.5 rounded-xl border border-[#dfe3ea] bg-white px-4 text-xs font-semibold text-[#1c4aa9] transition hover:bg-blue-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Configuration
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white font-bold bg-white/5 py-1.5 px-3 rounded-lg border border-[#1a1f2e] cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Close Editor
                    </button>
                  )}
                </div>
              )}
            </div>

            {setupLoadWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{setupLoadWarning}</span>
              </div>
            )}

            {!targetCompany ? (
              <div className="text-center p-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-400" />
                <p className="text-xs">No active company profile found.</p>
              </div>
            ) : loadingDetails ? (
              <div className="text-xs text-gray-500 text-center py-12 animate-pulse">Loading step configurations...</div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Tab Selector Sidebar inside Settings card */}
                <div className="flex flex-row md:flex-col gap-1 w-full md:w-52 overflow-x-auto shrink-0 pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-gray-850 pr-0 md:pr-4">
                  <button
                    type="button"
                    onClick={() => setSettingsTab("profile")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "profile"
                        ? "bg-teal-500/10 text-white border-l-2 border-teal-500"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" /> Step 1: Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("address")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "address"
                        ? "bg-teal-500/10 text-white border-l-2 border-teal-500"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <MapPin className="w-4 h-4 shrink-0" /> Step 2: Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("contact")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "contact"
                        ? "bg-teal-500/10 text-white border-l-2 border-teal-500"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <Contact className="w-4 h-4 shrink-0" /> Step 3: Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("localization")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "localization"
                        ? "bg-teal-500/10 text-white border-l-2 border-teal-500"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <Globe className="w-4 h-4 shrink-0" /> Steps 4-6: Locale & TZ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("fiscal")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "fiscal"
                        ? "bg-teal-500/10 text-white border-l-2 border-teal-500"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" /> Step 7: Fiscal Config
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab("modules")}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      settingsTab === "modules"
                        ? "bg-teal-500/10 text-white border-l-2 border-teal-500"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" /> Step 8: Sectors & LOBs
                  </button>
                </div>

                {/* Tab content body */}
                <div className="flex-1 w-full min-w-0">

                  {/* profile TAB */}
                  {settingsTab === "profile" && (
                    !isEditing ? (
                      <div className="flex flex-col gap-6">
                        {/* Logo & Header Card */}
                        <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#121824] flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl border border-gray-800 bg-[#0b0f19] flex items-center justify-center overflow-hidden shrink-0">
                            {currentLogoUrl ? (
                              <img
                                src={currentLogoUrl.startsWith('/') ? `${backendUrl}${currentLogoUrl}` : currentLogoUrl}
                                alt="Company Logo"
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-600" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-white">{setupDetails?.company?.company_name || targetCompany?.company_name}</span>
                            <span className="text-xs text-gray-400 font-mono">{setupDetails?.company?.company_code || targetCompany?.company_code} • {setupDetails?.company?.company_type || targetCompany?.company_type}</span>
                            {setupDetails?.company?.website && (
                              <a href={setupDetails.company.website} target="_blank" rel="noreferrer" className="text-xs text-teal-400 hover:underline">
                                {setupDetails.company.website}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Company Code</span>
                            <span className="text-xs font-semibold text-white mt-1 font-mono bg-[#121824] border border-[#1a1f2e] px-3 py-1.5 rounded-xl w-fit">
                              {setupDetails?.company?.company_code || targetCompany?.company_code}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Legal Entity Name</span>
                            <span className="text-xs font-semibold text-white mt-2">{setupDetails?.company?.company_name || targetCompany?.company_name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Display / Brand Name</span>
                            <span className="text-xs font-semibold text-white mt-2">{setupDetails?.company?.company_display_name || targetCompany?.company_display_name || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Business Classification</span>
                            <span className="text-xs font-semibold text-white mt-2">{setupDetails?.company?.company_type || targetCompany?.company_type || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Primary Industry</span>
                            <span className="text-xs font-semibold text-white mt-2">{setupDetails?.company?.industry_type || targetCompany?.industry_type || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tax Registration ID (GSTIN / TIN)</span>
                            <span className="text-xs font-semibold text-white mt-1 font-mono bg-[#121824] border border-[#1a1f2e] px-3 py-1.5 rounded-xl w-fit">
                              {setupDetails?.company?.tax_id || targetCompany?.tax_id || "—"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tax Regime Scheme</span>
                            <span className="text-xs font-semibold text-white mt-2">{setupDetails?.company?.tax_regime || "STANDARD"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Corporate Registration No (CIN)</span>
                            <span className="text-xs font-semibold text-white mt-1.5 font-mono bg-[#121824] border border-[#1a1f2e] px-3 py-1.5 rounded-xl w-fit">
                              {setupDetails?.company?.registration_no || targetCompany?.registration_no || "—"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Incorporation Date</span>
                            <span className="text-xs font-semibold text-white mt-2">{setupDetails?.company?.incorporation_date || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Official Website</span>
                            <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.company?.website || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Auto-Verify Email Domain</span>
                            <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.company?.email_domain || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Support Email</span>
                            <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.company?.support_email || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Primary Phone / Landline</span>
                            <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.company?.phone_primary || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Primary Accent Color</span>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-5 h-5 rounded-lg border border-[#1a1f2e]" style={{ backgroundColor: setupDetails?.company?.primary_color_hex || targetCompany?.primary_color_hex || "#1F4E79" }} />
                              <span className="text-xs font-mono text-gray-300 uppercase">{setupDetails?.company?.primary_color_hex || targetCompany?.primary_color_hex || "#1F4E79"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        {/* Logo Upload Section */}
                        <div className="p-4 rounded-xl border border-gray-800 bg-[#121824] flex flex-col sm:flex-row items-center gap-4">
                          <div className="w-16 h-16 rounded-xl border border-dashed border-gray-700 bg-[#0b0f19] flex items-center justify-center overflow-hidden shrink-0">
                            {profileForm.company_logo_url ? (
                              <img
                                src={profileForm.company_logo_url.startsWith('/') ? `${backendUrl}${profileForm.company_logo_url}` : profileForm.company_logo_url}
                                alt="Logo Preview"
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-600" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-semibold text-gray-300">Company Logo Image</label>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-semibold hover:bg-teal-500/20 transition-all w-fit">
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
                          <Input
                            label="Company Code (Read Only)"
                            value={profileForm.company_code}
                            disabled
                            className="opacity-50"
                          />
                          <Input
                            label="Legal Entity Name"
                            value={profileForm.company_name}
                            onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                            required
                          />
                          <Input
                            label="Display / Brand Name"
                            value={profileForm.company_display_name}
                            onChange={(e) => setProfileForm({ ...profileForm, company_display_name: e.target.value })}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Classification</label>
                            <select
                              value={profileForm.company_type}
                              onChange={(e) => setProfileForm({ ...profileForm, company_type: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="Sole Proprietor">Sole Proprietor</option>
                              <option value="Partnership">Partnership</option>
                              <option value="Pvt Ltd">Pvt Ltd</option>
                              <option value="LLP">LLP</option>
                              <option value="Trust">Trust</option>
                              <option value="Co-operative">Co-operative</option>
                            </select>
                          </div>
                          <Input
                            label="Primary Industry"
                            value={profileForm.industry_type}
                            onChange={(e) => setProfileForm({ ...profileForm, industry_type: e.target.value })}
                            required
                          />
                          <Input
                            label="Tax Registration ID"
                            value={profileForm.tax_id}
                            onChange={(e) => setProfileForm({ ...profileForm, tax_id: e.target.value })}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tax Regime</label>
                            <select
                              value={profileForm.tax_regime}
                              onChange={(e) => setProfileForm({ ...profileForm, tax_regime: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="STANDARD">Standard Scheme</option>
                              <option value="COMPOSITION">Composition Scheme</option>
                              <option value="EXEMPT">Exempt / Non-Taxable</option>
                            </select>
                          </div>
                          <Input
                            label="Corporate Registration No"
                            value={profileForm.registration_no}
                            onChange={(e) => setProfileForm({ ...profileForm, registration_no: e.target.value })}
                          />
                          <Input
                            label="Incorporation Date"
                            type="date"
                            value={profileForm.incorporation_date}
                            onChange={(e) => setProfileForm({ ...profileForm, incorporation_date: e.target.value })}
                          />
                          <Input
                            label="Website URL"
                            placeholder="https://greenvalleyfarms.in"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                          />
                          <Input
                            label="Email Domain (for Auto-verify)"
                            placeholder="greenvalleyfarms.in"
                            value={profileForm.email_domain}
                            onChange={(e) => setProfileForm({ ...profileForm, email_domain: e.target.value })}
                          />
                          <Input
                            label="Support Email"
                            placeholder="support@greenvalleyfarms.in"
                            type="email"
                            value={profileForm.support_email}
                            onChange={(e) => setProfileForm({ ...profileForm, support_email: e.target.value })}
                          />
                          <Input
                            label="Primary Phone / Landline"
                            placeholder="+91 11 2345 6789"
                            value={profileForm.phone_primary}
                            onChange={(e) => setProfileForm({ ...profileForm, phone_primary: e.target.value })}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Brand Hex Accent Color</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={profileForm.primary_color_hex}
                                onChange={(e) => setProfileForm({ ...profileForm, primary_color_hex: e.target.value })}
                                className="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer"
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
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Address Label / Tag</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.address?.address_label || "Primary HQ"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Address Type</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.address?.address_type || "HQ"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Address Line 1</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.address?.line1 || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Address Line 2</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.address?.line2 || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">City</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.address?.city || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">State / Province</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.address?.state_id || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Country Code</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.address?.country_id || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pincode / Postal Code</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.address?.pincode || "—"}</span>
                        </div>
                        <div className="flex flex-col sm:col-span-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">GPS Coordinates</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">
                            {setupDetails?.address?.gps_latitude && setupDetails?.address?.gps_longitude
                              ? `${setupDetails.address.gps_latitude}, ${setupDetails.address.gps_longitude}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Address Nickname / Tag"
                            placeholder="e.g. Headquarters - Gate 1"
                            value={addressForm.address_label}
                            onChange={(e) => setAddressForm({ ...addressForm, address_label: e.target.value })}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Address Type</label>
                            <select
                              value={addressForm.address_type}
                              onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="HQ">Corporate HQ</option>
                              <option value="Branch">Branch Office</option>
                              <option value="Warehouse">Warehouse Depot</option>
                              <option value="Farm">Farm Site</option>
                            </select>
                          </div>
                          <Input
                            label="Address Line 1"
                            value={addressForm.line1}
                            onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                            required
                          />
                          <Input
                            label="Address Line 2"
                            value={addressForm.line2}
                            onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                          />
                          <Input
                            label="City"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            required
                          />
                          <Input
                            label="State / Province"
                            value={addressForm.state_id}
                            onChange={(e) => setAddressForm({ ...addressForm, state_id: e.target.value })}
                            required
                          />
                          <Input
                            label="Country"
                            value={addressForm.country_id}
                            onChange={(e) => setAddressForm({ ...addressForm, country_id: e.target.value })}
                            required
                          />
                          <Input
                            label="Pincode"
                            value={addressForm.pincode}
                            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                            required
                          />
                          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                            <Input
                              label="GPS Latitude"
                              placeholder="e.g. 28.6139"
                              value={addressForm.gps_latitude}
                              onChange={(e) => setAddressForm({ ...addressForm, gps_latitude: e.target.value })}
                            />
                            <Input
                              label="GPS Longitude"
                              placeholder="e.g. 77.2090"
                              value={addressForm.gps_longitude}
                              onChange={(e) => setAddressForm({ ...addressForm, gps_longitude: e.target.value })}
                            />
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
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Contact Person Name</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.contact?.full_name || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Designation</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.contact?.designation || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Primary Phone</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.contact?.phone_primary || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Secondary Phone</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.contact?.phone_secondary || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Primary Email</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.contact?.email || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Alerts & System Emails</span>
                          <span className="text-xs font-semibold text-white mt-2">
                            {setupDetails?.contact?.receives_alerts ? "Active - Receives ERP threshold notifications" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex flex-col sm:col-span-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Executive Reports Emails</span>
                          <span className="text-xs font-semibold text-white mt-2">
                            {setupDetails?.contact?.receives_reports ? "Active - Receives periodic executive summary reports" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Key Contact Person Full Name"
                            value={contactForm.full_name}
                            onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })}
                            required
                          />
                          <Input
                            label="Designation Role"
                            value={contactForm.designation}
                            onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                            required
                          />
                          <Input
                            label="Primary Contact Phone"
                            value={contactForm.phone_primary}
                            onChange={(e) => setContactForm({ ...contactForm, phone_primary: e.target.value })}
                            required
                          />
                          <Input
                            label="Secondary Contact Phone"
                            value={contactForm.phone_secondary}
                            onChange={(e) => setContactForm({ ...contactForm, phone_secondary: e.target.value })}
                          />
                          <Input
                            label="Primary Email"
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            required
                          />
                          <div className="flex flex-col gap-2 justify-center pt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={contactForm.receives_alerts}
                                onChange={(e) => setContactForm({ ...contactForm, receives_alerts: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-800 bg-gray-900 text-teal-500 cursor-pointer"
                              />
                              <span className="text-gray-300 font-medium">Receive system threshold alerts</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={contactForm.receives_reports}
                                onChange={(e) => setContactForm({ ...contactForm, receives_reports: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-800 bg-gray-900 text-teal-500 cursor-pointer"
                              />
                              <span className="text-gray-300 font-medium">Receive periodic executive reports</span>
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
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Default Language</span>
                          <span className="text-xs font-semibold text-white mt-2">
                            {languages.find(l => l.lang_id === setupDetails?.company?.default_language_id)?.lang_name || setupDetails?.company?.default_language_id || "—"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Base Currency</span>
                          <span className="text-xs font-semibold text-white mt-2">
                            {currencies.find(c => c.currency_id === setupDetails?.company?.base_currency_id)?.currency_name || setupDetails?.company?.base_currency_id || "—"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-505 font-bold uppercase tracking-wider">Default Timezone</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.company?.default_timezone_id || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-505 font-bold uppercase tracking-wider">Country Locale Code</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.company?.country_id || "—"}</span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Default Language</label>
                            <select
                              value={localizationForm.default_language_id}
                              onChange={(e) => setLocalizationForm({ ...localizationForm, default_language_id: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="">Select Language</option>
                              {languages.map((l: any) => (
                                <option key={l.lang_id} value={l.lang_id}>{l.lang_name} ({l.lang_code})</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Base Currency</label>
                            <select
                              value={localizationForm.base_currency_id}
                              onChange={(e) => setLocalizationForm({ ...localizationForm, base_currency_id: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="">Select Currency</option>
                              {currencies.map((c: any) => (
                                <option key={c.currency_id} value={c.currency_id}>{c.currency_name} ({c.currency_code})</option>
                              ))}
                            </select>
                          </div>
                          <Input
                            label="Timezone ID"
                            value={localizationForm.default_timezone_id}
                            onChange={(e) => setLocalizationForm({ ...localizationForm, default_timezone_id: e.target.value })}
                            required
                          />
                          <Input
                            label="Operating Country Code"
                            value={localizationForm.country_id}
                            onChange={(e) => setLocalizationForm({ ...localizationForm, country_id: e.target.value.toUpperCase() })}
                            required
                          />
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
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fiscal Year Format</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.fiscal?.fiscal_year_format || "FY APR-MAR"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fiscal Start Month & Day</span>
                          <span className="text-xs font-semibold text-white mt-2">
                            {setupDetails?.fiscal?.fiscal_start_month ? `Month ${setupDetails.fiscal.fiscal_start_month}` : "Month 4 (April)"} (Day {setupDetails?.fiscal?.fiscal_start_day || 1} to Day {setupDetails?.fiscal?.fiscal_end_day || 31})
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Fiscal Year</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.fiscal?.current_fiscal_year || "2026-27"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Period Type</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.fiscal?.period_type || "MONTHLY"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Accounting Standard</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.fiscal?.accounting_standard || "Local GAAP"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Asset Depreciation Model</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.fiscal?.depreciation_method || "SLM (Straight Line)"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Inventory Costing Model</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.fiscal?.inventory_valuation || "FIFO"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">GST / Tax Filing Frequency</span>
                          <span className="text-xs font-semibold text-white mt-2">{setupDetails?.fiscal?.gst_filing_frequency || "MONTHLY"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Statutory Tax Audit</span>
                          <span className="text-xs font-semibold text-white mt-2">
                            {setupDetails?.fiscal?.tax_audit_applicable ? "Mandatory Tax Audit Applicable" : "Not Applicable"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Decimal Precision</span>
                          <span className="text-xs font-semibold text-white mt-2 font-mono">{setupDetails?.fiscal?.decimal_places ?? 2} Decimal Places</span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveTab} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fiscal Start Month</label>
                            <select
                              value={fiscalForm.fiscal_start_month}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, fiscal_start_month: parseInt(e.target.value) })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value={1}>January</option>
                              <option value={4}>April</option>
                            </select>
                          </div>
                          <Input
                            label="Current Fiscal Year"
                            placeholder="e.g. 2026-27"
                            value={fiscalForm.current_fiscal_year}
                            onChange={(e) => setFiscalForm({ ...fiscalForm, current_fiscal_year: e.target.value })}
                            required
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Accounting Periodicity</label>
                            <select
                              value={fiscalForm.period_type}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, period_type: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="MONTHLY">Monthly Periods</option>
                              <option value="QUARTERLY">Quarterly Periods</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Accounting Standard</label>
                            <select
                              value={fiscalForm.accounting_standard}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, accounting_standard: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="Local GAAP">Local GAAP</option>
                              <option value="IFRS">IFRS</option>
                              <option value="US GAAP">US GAAP</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Asset Depreciation Model</label>
                            <select
                              value={fiscalForm.depreciation_method}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, depreciation_method: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="SLM">Straight Line Method (SLM)</option>
                              <option value="WDV">Written Down Value (WDV)</option>
                              <option value="UNITS_OF_PRODUCTION">Units of Production</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Inventory Costing Method</label>
                            <select
                              value={fiscalForm.inventory_valuation}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, inventory_valuation: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="FIFO">FIFO (First-In, First-Out)</option>
                              <option value="Weighted Average">Weighted Average Cost</option>
                              <option value="STANDARD COSTING">Standard Costing</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">GST / Tax Filing Frequency</label>
                            <select
                              value={fiscalForm.gst_filing_frequency}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, gst_filing_frequency: e.target.value })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="MONTHLY">Monthly Filing</option>
                              <option value="QUARTERLY">Quarterly Filing</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Decimal Precision</label>
                            <select
                              value={fiscalForm.decimal_places}
                              onChange={(e) => setFiscalForm({ ...fiscalForm, decimal_places: parseInt(e.target.value) })}
                              className="bg-[#121824] border border-[#1a1f2e] rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value={2}>2 Decimal Places (0.00)</option>
                              <option value={3}>3 Decimal Places (0.000)</option>
                              <option value={4}>4 Decimal Places (0.0000)</option>
                            </select>
                          </div>
                          <div className="flex flex-col justify-center pt-2 sm:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={fiscalForm.tax_audit_applicable}
                                onChange={(e) => setFiscalForm({ ...fiscalForm, tax_audit_applicable: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-800 bg-gray-900 text-teal-500 cursor-pointer"
                              />
                              <span className="text-gray-300 font-medium">Mandatory Statutory Tax Audit Applicable</span>
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
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Activated Sectors & LOB Verticals</span>
                        {modulesForm.length === 0 ? (
                          <div className="text-xs text-gray-500 bg-[#121824] p-4 rounded-xl border border-gray-850">No business modules enabled. Click Edit above to select sectors.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {nobs.map((n: any) => {
                              const isNobActive = modulesForm.includes(n.nob_code);
                              if (!isNobActive) return null;

                              const associatedLobs = lobMap[n.nob_id] || [];
                              const activeLobs = associatedLobs.filter(l => modulesForm.includes(l.lob_code));

                              return (
                                <div key={n.nob_id} className="p-4 rounded-xl bg-[#121824] border border-[#1a1f2e] flex flex-col gap-2">
                                  <div className="flex items-center gap-2 border-b border-gray-850 pb-2">
                                    <span className="font-bold text-xs text-white">{n.nob_name}</span>
                                    <span className="text-[9px] bg-teal-500/10 text-teal-400 font-bold border border-teal-500/20 px-1.5 py-0.5 rounded font-mono uppercase shrink-0">Active</span>
                                  </div>
                                  <div className="flex flex-col gap-1 mt-1">
                                    <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider">Active Operations (LOBs):</span>
                                    {activeLobs.length === 0 ? (
                                      <span className="text-xs text-gray-500">None active</span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {activeLobs.map(lob => (
                                          <span key={lob.lob_id} className="text-[10px] text-gray-300 bg-white/[0.03] px-2 py-0.5 rounded border border-gray-800">{lob.lob_name}</span>
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
                                className={`p-4 border rounded-2xl flex flex-col gap-2 cursor-pointer transition-all ${
                                  isNobChecked
                                    ? "border-teal-500/40 bg-teal-500/5"
                                    : "border-gray-800 bg-[#121824]/50 hover:border-gray-700"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-white">{n.nob_name}</span>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    isNobChecked ? "bg-teal-500 border-teal-500 text-white" : "border-gray-700"
                                  }`}>
                                    {isNobChecked && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500">{n.description || "Link this sector to enable daily feed logs and batches."}</p>

                                {/* LOB Checkboxes inside setup view */}
                                {isNobChecked && (
                                  <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Select Active Operations (LOBs):</span>
                                    {loadingLobs[n.nob_id] ? (
                                      <div className="text-[11px] text-gray-505 animate-pulse py-1">Loading active sub-sectors...</div>
                                    ) : associatedLobs.length === 0 ? (
                                      <div className="text-[11px] text-gray-505 py-1">No sub-sectors available.</div>
                                    ) : (
                                      <div className="flex flex-col gap-1.5 mt-1">
                                        {associatedLobs.map((lob: any) => {
                                          const isLobChecked = modulesForm.includes(lob.lob_code);
                                          return (
                                            <label
                                              key={lob.lob_id}
                                              className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-white/[0.02] text-xs transition-colors"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isLobChecked}
                                                onChange={() => handleLobToggle(lob.lob_code)}
                                                className="w-4 h-4 rounded border-gray-800 bg-gray-900 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                                              />
                                              <div className="flex flex-col">
                                                <span className="font-semibold text-gray-200">{lob.lob_name}</span>
                                                {lob.description && <span className="text-[10px] text-gray-500">{lob.description}</span>}
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
          <Card className="nf-company-config flex flex-col gap-4 border-[#e3e7ee] bg-white p-6">
            <h4 className="text-sm font-semibold text-[#2e313f]">Tenant configuration summary</h4>
            {targetCompany ? (
              <div className="text-xs text-gray-400 flex flex-col gap-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-850">
                  <span className="text-gray-500 font-medium">Base Currency</span>
                  <span className="text-white font-semibold font-mono bg-[#121824] px-2 py-0.5 rounded border border-[#1a1f2e]">
                    {currencies.find(c => c.currency_id === targetCompany?.base_currency_id)?.currency_name || "INR"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-850">
                  <span className="text-gray-500 font-medium">Timezone</span>
                  <span className="text-white font-semibold">{targetCompany?.default_timezone_id || "Asia/Kolkata"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-850">
                  <span className="text-gray-500 font-medium">Operating Country</span>
                  <span className="text-white font-semibold font-mono bg-[#121824] px-2 py-0.5 rounded border border-[#1a1f2e]">
                    {targetCompany?.country_id || "IND"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 font-medium">Onboarding Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    targetCompany?.onboarding_status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {targetCompany?.onboarding_status || 'PENDING'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">No company selected.</div>
            )}
          </Card>

        </div>

        {/* Right Column: Manage Users */}
        <div className="flex flex-col gap-4 lg:col-span-4">

          {/* User list card */}
          <Card className="nf-company-config border-[#e3e7ee] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#edf0f4] pb-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2e313f]"><Users className="h-4 w-4 text-[#1c4aa9]" />{isTenantAdmin ? "Company administrators" : "Company operators"}</h4>
              <button type="button" onClick={() => setShowAdminDialog(true)} className="nf-primary-action flex h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold text-white transition hover:opacity-90"><UserPlus size={14} /> Add</button>
            </div>

            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
              {loadingUsers ? (
                <div className="text-xs text-gray-500 text-center py-6">Loading team directory...</div>
              ) : companyUsers.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-6">No users assigned. Register one below.</div>
              ) : (
                companyUsers.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between rounded-xl border border-[#e7eaf0] bg-[#f8f9fb] p-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold text-xs text-white truncate">{u.full_name}</span>
                      <span className="text-[10px] text-gray-505 truncate">{u.email}</span>
                    </div>
                    <button
                      onClick={() => setUserPendingDeletion(u.user_id)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors shrink-0"
                      title="Deactivate account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Dialog open={showAdminDialog} onClose={() => setShowAdminDialog(false)} title={isTenantAdmin ? "Add company administrator" : "Add company operator"} description={`Create an account for ${targetCompany?.company_name ?? "this company"}.`} maxWidth="md">
            <form onSubmit={handleAddCompanyAdmin} className="flex flex-col gap-5">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={adminForm.fullName}
                onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="user@domain.com"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                required
              />
              <Input
                label="Temporary Password"
                type="password"
                placeholder="At least 8 characters"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                placeholder="+919999911111"
                value={adminForm.phone}
                onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
              />
              <div className="mt-1 flex flex-col-reverse gap-3 border-t border-[#edf0f4] pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowAdminDialog(false)} className="h-11 rounded-xl border border-[#e3e7ee] bg-white px-5 text-sm font-medium text-[#515463] hover:bg-[#f7f8fa]">Cancel</button>
              <Button type="submit" disabled={addingAdmin} className="flex h-11 items-center justify-center gap-2 bg-[#0b1248] px-5 text-xs text-white hover:bg-[#151d5e]">
                <UserPlus className="w-4 h-4" /> {addingAdmin ? "Registering..." : (isTenantAdmin ? "Add Administrator" : "Add Operator")}
              </Button>
              </div>
            </form>
          </Dialog>

          <Dialog open={Boolean(userPendingDeletion)} onClose={() => setUserPendingDeletion(null)} title="Deactivate account" description="The user will no longer be able to access this company workspace." maxWidth="sm">
            <div className="space-y-5">
              <p className="text-sm leading-6 text-[#515463]">Are you sure you want to deactivate this account?</p>
              <div className="flex flex-col-reverse gap-3 border-t border-[#edf0f4] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setUserPendingDeletion(null)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={() => userPendingDeletion && handleDeleteUser(userPendingDeletion)} className="min-h-10 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700">Deactivate</button>
              </div>
            </div>
          </Dialog>

        </div>

      </div>
    </div>
  );
}
