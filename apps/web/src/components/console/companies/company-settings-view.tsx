"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Activity } from "lucide-react";
import { useCompaniesPageData } from "@/components/console/companies/use-companies-page-data";
import CompanyTab, { SETTINGS_SECTIONS } from "@/components/console/console-tabs/company-tab";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/PageHeader";

const S = {
  muted: { color: "var(--text-muted)" },
};

function StatusBadge({ status, t }: { status: string; t: (key: any) => string }) {
  const ok = status === "COMPLETED";
  return (
    <Badge variant={ok ? "success" : "warning"}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
      {ok ? t("coStatusComplete") : t("coStatusPending")}
    </Badge>
  );
}

export function CompanySettingsView({ companyId, section = "profile", basePath = "/company/settings" }: { companyId: string; section?: string; basePath?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, tenantId, companies, currencies, loading, error, reload } = useCompaniesPageData();
  const activeSection = SETTINGS_SECTIONS.find((sec) => sec.key === section) ?? SETTINGS_SECTIONS[0];

  // The sections belong in the console's own sub-sidebar, next to where Master
  // Data and Finance put theirs — not in a second sidebar drawn inside the
  // page. Same component, same place on screen, same behaviour.
  const contextNav = useMemo<ContextNavModel>(() => ({
    label: t("ctSettingsSections"),
    groups: [{ items: SETTINGS_SECTIONS.map((s) => ({ key: s.key, label: t(s.labelKey as any) })) }],
    activeKey: section,
    onSelect: (key: string) => router.push(`${basePath}/${key}`),
  }), [section, basePath, t, router]);
  useContextNav(contextNav);

  if (loading) return <LoadingState label={t("coLoadingCompanies")} />;

  const targetCompany = companies.find((c: any) => c.company_id === companyId);

  if (!targetCompany) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title={t("coNotFoundTitle")} sticky={false} />
        <ErrorState message={t("coNotFoundDesc")} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8">
      {/* Everything identifying the page lives here, once. The section's own
          title and description used to be a card header below this, and the
          company's name and code a second card below that — three heading
          blocks before the first field.

          The company name is deliberately not repeated in this header: the
          breadcrumb above it and the company card in the main sidebar both
          already carry it, so a third copy is what pushed the form off the
          first screen. The section name is likewise not repeated — the
          sub-sidebar marks the active section, which is the same information
          in the place the user just clicked. */}
      <PageHeader
        title={t("coSettingsTitle")}
        description={t(activeSection.descKey)}
        meta={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={S.muted}>
            <span className="font-mono">{targetCompany.company_code}</span>
            {targetCompany.registration_no && <span>{t("coRegLabel")} {targetCompany.registration_no}</span>}
            {targetCompany.country_id && <span>{targetCompany.country_id}</span>}
            <StatusBadge status={targetCompany.onboarding_status} t={t} />
          </div>
        }
        actions={
          user?.userType === "TENANT_ADMIN" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/companies")}
              aria-label={t("coBackToAllCompanies")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {t("coBackToAllCompanies")}
            </Button>
          ) : undefined
        }
        sticky={false}
      />

      {error && <ErrorState message={error} />}

      <CompanyTab
        activeCompany={targetCompany}
        currencies={currencies}
        tenantId={tenantId}
        onRefreshCompany={reload as any}
        companies={[targetCompany]}
        currentUser={user}
        onSelectCompany={(company: any) => void company}
        skipDirectory={true}
        section={section}
      />
    </div>
  );
}
