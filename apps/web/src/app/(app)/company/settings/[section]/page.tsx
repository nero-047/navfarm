"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CompanySettingsView } from "@/components/console/companies/company-settings-view";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * One route per settings section, so the sub-sidebar selection is the URL —
 * the same shape Master Data and Finance use. Settings used to be a single
 * page you opened a modal on top of; a section you can link to, reload and go
 * back from is what the rest of the console does.
 */
export default function CompanySettingsSectionRoute() {
  const { t } = useLanguage();
  const params = useParams<{ section: string }>();
  const [companyId, setCompanyId] = useState<string | null | undefined>(undefined);

  useEffect(() => { setCompanyId(getActiveCompanyId()); }, []);

  if (companyId === undefined) return <LoadingState label={t("coLoadingCompanies")} />;
  if (!companyId) return <ErrorState message={t("coNotFoundDesc")} />;
  return <CompanySettingsView companyId={companyId} section={params.section} />;
}
