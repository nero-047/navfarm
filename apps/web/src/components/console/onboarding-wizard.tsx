import React from "react";
import { Building2, MapPin, Contact, Globe, Coins, Clock, Calendar, Layers, CheckCircle2, Check, RefreshCw } from "lucide-react";
import Step1Profile from "./wizard-steps/step1-profile";
import Step2Address from "./wizard-steps/step2-address";
import Step3Contact from "./wizard-steps/step3-contact";
import Step4Language from "./wizard-steps/step4-language";
import Step5Currency from "./wizard-steps/step5-currency";
import Step6Timezone from "./wizard-steps/step6-timezone";
import Step7Fiscal from "./wizard-steps/step7-fiscal";
import Step8Modules from "./wizard-steps/step8-modules";
import Step9Finalize from "./wizard-steps/step9-finalize";
import { api } from "../../services/api-client";

interface OnboardingWizardProps {
  wizardSteps: any[];
  activeWizardStep: number;
  setActiveWizardStep: (step: number) => void;
  activeCompany: any;
  setActiveCompany: (company: any) => void;
  tenantId: string;
  languages: any[];
  currencies: any[];
  nobs: any[];
  isSubmitting: boolean;
  setIsSubmitting: (val: boolean) => void;
  setActionError: (msg: string) => void;
  setActionSuccess: (msg: string) => void;
  fetchWizardProgress: (companyId: string) => Promise<void>;
  loadConsoleWorkspace: () => Promise<void>;
}

export default function OnboardingWizard({
  wizardSteps,
  activeWizardStep,
  setActiveWizardStep,
  activeCompany,
  setActiveCompany,
  tenantId,
  languages,
  currencies,
  nobs,
  isSubmitting,
  setIsSubmitting,
  setActionError,
  setActionSuccess,
  fetchWizardProgress,
  loadConsoleWorkspace,
}: OnboardingWizardProps) {

  const [setupDetails, setSetupDetails] = React.useState<any>(null);
  const [loadingDetails, setLoadingDetails] = React.useState(false);

  const fetchSetupDetails = async (companyId: string) => {
    if (!companyId) return;
    setLoadingDetails(true);
    try {
      const details = await api.get(`/setup/wizard/company-details/${companyId}`);
      setSetupDetails(details);
    } catch (err) {
      console.error("Failed to load step details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  React.useEffect(() => {
    if (activeCompany?.company_id) {
      fetchSetupDetails(activeCompany.company_id);
    }
  }, [activeCompany?.company_id]);

  // Submit handlers
  const handleStep1Submit = async (data: any) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      const comp = await api.post("/setup/wizard/step-1", {
        ...data,
        tenant_id: tenantId,
        company_id: activeCompany?.company_id
      });
      setActiveCompany(comp);
      setActionSuccess("Company profile registered successfully!");
      await fetchWizardProgress(comp.company_id);
      await fetchSetupDetails(comp.company_id);
      setActiveWizardStep(2);
    } catch (err: any) {
      setActionError(err?.message || "Step 1 registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (data: any) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.post("/setup/wizard/step-2", {
        company_id: activeCompany.company_id,
        address_type: data.address_type,
        line1: data.address_line_1,
        line2: data.address_line_2,
        city: data.city,
        state_id: data.state_province,
        country_id: data.country_name,
        pincode: data.postal_code,
        gps_latitude: parseFloat(data.gps_lat) || undefined,
        gps_longitude: parseFloat(data.gps_lng) || undefined,
      });
      setActionSuccess("Company address configured successfully!");
      await fetchWizardProgress(activeCompany.company_id);
      await fetchSetupDetails(activeCompany.company_id);
      setActiveWizardStep(3);
    } catch (err: any) {
      setActionError(err?.message || "Step 2 failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Submit = async (data: any) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.post("/setup/wizard/step-3", {
        company_id: activeCompany.company_id,
        contact_type: "PRIMARY",
        full_name: data.contact_name,
        designation: data.designation,
        email: data.contact_email,
        phone_primary: data.contact_phone,
        receives_alerts: true,
      });
      setActionSuccess("Contact details associated successfully!");
      await fetchWizardProgress(activeCompany.company_id);
      await fetchSetupDetails(activeCompany.company_id);
      setActiveWizardStep(4);
    } catch (err: any) {
      setActionError(err?.message || "Step 3 failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep4Submit = async (langId: string) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.post(`/setup/wizard/step-4/${activeCompany.company_id}/${langId}`);
      setActionSuccess("Language preferences saved!");
      await fetchWizardProgress(activeCompany.company_id);
      await fetchSetupDetails(activeCompany.company_id);
      setActiveWizardStep(5);
    } catch (err: any) {
      setActionError(err?.message || "Step 4 failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep5Submit = async (currencyId: string) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.post(`/setup/wizard/step-5/${activeCompany.company_id}/${currencyId}`);
      setActionSuccess("Base currency saved!");
      await fetchWizardProgress(activeCompany.company_id);
      await fetchSetupDetails(activeCompany.company_id);
      setActiveWizardStep(6);
    } catch (err: any) {
      setActionError(err?.message || "Step 5 failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep6Submit = async (tz: string, country: string) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.post(`/setup/wizard/step-6/${activeCompany.company_id}/${encodeURIComponent(tz)}/${country.toUpperCase()}`);
      setActionSuccess("Timezone and locale saved!");
      await fetchWizardProgress(activeCompany.company_id);
      await fetchSetupDetails(activeCompany.company_id);
      setActiveWizardStep(7);
    } catch (err: any) {
      setActionError(err?.message || "Step 6 failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep7Submit = async (data: any) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      const isAprilStart = data.fiscal_start_month === 4;
      await api.post("/setup/wizard/step-7", {
        company_id: activeCompany.company_id,
        fiscal_year_format: isAprilStart ? "FY APR-MAR" : "FY JAN-DEC",
        fiscal_start_month: data.fiscal_start_month,
        fiscal_start_day: 1,
        current_fiscal_year: "2026-27",
        period_type: "MONTHLY",
        accounting_standard: "Local GAAP",
        inventory_valuation: data.valuation_method === "WEIGHTED_AVG" ? "Weighted Average" : data.valuation_method === "FIFO" ? "FIFO" : "STANDARD COSTING"
      });
      setActionSuccess("Fiscal parameters registered!");
      await fetchWizardProgress(activeCompany.company_id);
      await fetchSetupDetails(activeCompany.company_id);
      setActiveWizardStep(8);
    } catch (err: any) {
      setActionError(err?.message || "Step 7 failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep8Submit = async (selectedNobs: string[]) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.post(`/setup/wizard/step-8/${activeCompany.company_id}`, {
        modules: selectedNobs
      });
      setActionSuccess("Business segments linked successfully!");
      await fetchWizardProgress(activeCompany.company_id);
      await fetchSetupDetails(activeCompany.company_id);
      setActiveWizardStep(9);
    } catch (err: any) {
      setActionError(err?.message || "Step 8 failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.post(`/setup/wizard/complete/${activeCompany.company_id}`);
      setActionSuccess("ERP Setup wizard complete! Welcome to NAVFarm!");
      setTimeout(() => {
        loadConsoleWorkspace();
      }, 1500);
    } catch (err: any) {
      setActionError(err?.message || "Finalization failed. Please verify all wizard checklist items are completed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-12 flex flex-col md:flex-row gap-8 overflow-y-auto">

      {/* Progress Menu (Left Sidebar) */}
      <aside className="md:w-72 shrink-0 flex flex-col gap-3">
        <div className="p-4 bg-[#0b0f19] border border-gray-800 rounded-2xl flex flex-col gap-1 mb-2">
          <h3 className="font-bold text-white text-sm">ERP Setup Wizard</h3>
          <p className="text-xs text-gray-400">Configure your company settings to activate agricultural management.</p>
        </div>

        {[
          { order: 1, label: "Company Profile", icon: <Building2 className="w-4 h-4" /> },
          { order: 2, label: "Operating Addresses", icon: <MapPin className="w-4 h-4" /> },
          { order: 3, label: "Primary Contact", icon: <Contact className="w-4 h-4" /> },
          { order: 4, label: "Language Catalog", icon: <Globe className="w-4 h-4" /> },
          { order: 5, label: "Base Currency", icon: <Coins className="w-4 h-4" /> },
          { order: 6, label: "Timezone & Country", icon: <Clock className="w-4 h-4" /> },
          { order: 7, label: "Fiscal Accounting", icon: <Calendar className="w-4 h-4" /> },
          { order: 8, label: "Nature of Business", icon: <Layers className="w-4 h-4" /> },
          { order: 9, label: "Complete Wizard", icon: <CheckCircle2 className="w-4 h-4" /> }
        ].map((step) => {
          const isCompleted = wizardSteps.find(s => s.stepOrder === step.order)?.status === "COMPLETED";
          const isActive = activeWizardStep === step.order;
          const isClickable = isCompleted || step.order <= activeWizardStep;
          return (
            <button
              key={step.order}
              type="button"
              disabled={!isClickable}
              onClick={() => setActiveWizardStep(step.order)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left outline-none ${
                isActive
                  ? "bg-teal-500/10 border-teal-500/30 text-white shadow-sm shadow-teal-500/5"
                  : isCompleted
                  ? "border-gray-800 bg-[#0b0f19]/30 text-gray-400 hover:bg-white/[0.02] cursor-pointer"
                  : isClickable
                  ? "border-transparent text-gray-500 hover:text-gray-300 cursor-pointer"
                  : "border-transparent text-gray-700 cursor-not-allowed opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {step.icon}
                <span>{step.label}</span>
              </div>
              {isCompleted && <Check className="w-4 h-4 text-teal-400" />}
            </button>
          );
        })}
      </aside>

      {/* Wizard Form Panel (Right Side) */}
      <main className="flex-1 bg-[#0b0f19] border border-gray-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6 justify-between animate-fade-in">
        <div className="flex-1">
          {loadingDetails ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="animate-spin w-6 h-6 text-teal-400" />
            </div>
          ) : (
            <>
              {activeWizardStep === 1 && (
                <Step1Profile onSubmit={handleStep1Submit} isSubmitting={isSubmitting} initialData={setupDetails?.company || activeCompany} />
              )}
              {activeWizardStep === 2 && (
                <Step2Address
                  onSubmit={handleStep2Submit}
                  isSubmitting={isSubmitting}
                  initialData={setupDetails?.address ? {
                    address_line_1: setupDetails.address.line1,
                    address_line_2: setupDetails.address.line2,
                    city: setupDetails.address.city,
                    state_province: setupDetails.address.state_id,
                    postal_code: setupDetails.address.pincode,
                    country_name: setupDetails.address.country_id,
                    address_type: setupDetails.address.address_type,
                    gps_lat: setupDetails.address.gps_latitude,
                    gps_lng: setupDetails.address.gps_longitude,
                  } : null}
                />
              )}
              {activeWizardStep === 3 && (
                <Step3Contact
                  onSubmit={handleStep3Submit}
                  isSubmitting={isSubmitting}
                  initialData={setupDetails?.contact ? {
                    contact_name: setupDetails.contact.full_name,
                    contact_email: setupDetails.contact.email,
                    contact_phone: setupDetails.contact.phone_primary,
                    designation: setupDetails.contact.designation,
                  } : null}
                />
              )}
              {activeWizardStep === 4 && (
                <Step4Language
                  onSubmit={handleStep4Submit}
                  isSubmitting={isSubmitting}
                  languages={languages}
                  initialValue={setupDetails?.company?.default_language_id || activeCompany?.default_language_id}
                />
              )}
              {activeWizardStep === 5 && (
                <Step5Currency
                  onSubmit={handleStep5Submit}
                  isSubmitting={isSubmitting}
                  currencies={currencies}
                  initialValue={setupDetails?.company?.base_currency_id || activeCompany?.base_currency_id}
                />
              )}
              {activeWizardStep === 6 && (
                <Step6Timezone
                  onSubmit={handleStep6Submit}
                  isSubmitting={isSubmitting}
                  initialTz={setupDetails?.company?.default_timezone_id || activeCompany?.default_timezone_id}
                  onError={setActionError}
                />
              )}
              {activeWizardStep === 7 && (
                <Step7Fiscal
                  onSubmit={handleStep7Submit}
                  isSubmitting={isSubmitting}
                  initialData={setupDetails?.fiscal ? {
                    fiscal_start_month: setupDetails.fiscal.fiscal_start_month,
                    valuation_method:
                      setupDetails.fiscal.inventory_valuation === "Weighted Average"
                        ? "WEIGHTED_AVG"
                        : setupDetails.fiscal.inventory_valuation === "FIFO"
                        ? "FIFO"
                        : "STANDARD",
                  } : null}
                />
              )}
              {activeWizardStep === 8 && (
                <Step8Modules
                  onSubmit={handleStep8Submit}
                  isSubmitting={isSubmitting}
                  nobs={nobs}
                  initialModules={setupDetails?.modules}
                />
              )}
              {activeWizardStep === 9 && (
                <Step9Finalize onSubmit={handleFinalize} isSubmitting={isSubmitting} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
