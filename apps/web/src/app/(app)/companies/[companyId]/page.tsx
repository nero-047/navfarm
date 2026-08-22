"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Activity } from "lucide-react";
import { useCompaniesPageData } from "@/components/console/companies/use-companies-page-data";
import CompanyTab from "@/components/console/console-tabs/company-tab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/PageHeader";

const S = {
  primary: { color: "var(--text-primary)" },
  muted:   { color: "var(--text-muted)" },
};

function StatusBadge({ status }: { status: string }) {
  const ok = status === "COMPLETED";
  return (
    <Badge variant={ok ? "success" : "warning"}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
      {ok ? "Complete" : "Pending"}
    </Badge>
  );
}

export default function CompanySettingsPage() {
  const router = useRouter();
  const params = useParams<{ companyId: string }>();
  const { user, tenantId, companies, currencies, loading, error, reload } = useCompaniesPageData();

  if (loading) return <LoadingState label="Loading companies…" />;

  const targetCompany = companies.find((c: any) => c.company_id === params.companyId);

  if (!targetCompany) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title="Company not found" sticky={false} />
        <ErrorState message="This company doesn't exist or you don't have access to it." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8">
      <PageHeader
        title="Company settings"
        description={user?.userType === "TENANT_ADMIN" ? `Operating in context of ${targetCompany.company_name}` : undefined}
        actions={
          user?.userType === "TENANT_ADMIN" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/companies")}
              aria-label="Back to All Companies"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to All Companies
            </Button>
          ) : undefined
        }
        sticky={false}
      />

      <div className="flex items-center gap-4 rounded-[var(--radius-md)] border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-navy)" }}>
          {targetCompany.company_code?.substring(0, 2) || targetCompany.company_name?.substring(0, 2) || "CO"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold" style={S.primary}>{targetCompany.company_name}</div>
          <div className="text-xs flex items-center gap-3 mt-0.5" style={S.muted}>
            <span className="font-mono">{targetCompany.company_code}</span>
            {targetCompany.registration_no && <span>Reg: {targetCompany.registration_no}</span>}
            {targetCompany.country_id && <span>{targetCompany.country_id}</span>}
          </div>
        </div>
        <StatusBadge status={targetCompany.onboarding_status} />
      </div>

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
      />
    </div>
  );
}
