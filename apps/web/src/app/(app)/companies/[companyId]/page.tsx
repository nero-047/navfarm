"use client";

import { useParams } from "next/navigation";
import { CompanySettingsView } from "@/components/console/companies/company-settings-view";

/**
 * The tenant-scope route: a tenant admin opening one company out of the list,
 * which need not be the company they are scoped to — so this one keeps the id.
 * Company scope uses /company/settings, which resolves the active company.
 */
export default function CompanyByIdPage() {
  const params = useParams<{ companyId: string }>();
  return <CompanySettingsView companyId={params.companyId} basePath={`/companies/${params.companyId}`} />;
}
