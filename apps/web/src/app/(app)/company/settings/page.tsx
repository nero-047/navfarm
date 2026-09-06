"use client";

import { useEffect, useState } from "react";
import { CompanySettingsView } from "@/components/console/companies/company-settings-view";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Company scope has exactly one company — the one you are working in — so the
 * settings page does not need its id in the URL. Resolving it from the active
 * scope also means switching company in the workspace switcher switches what
 * this page shows, which is the behaviour someone with several companies
 * expects.
 *
 * /companies/[companyId] still exists for the other case: a tenant admin
 * opening a specific company out of the list, which may not be the one they
 * are scoped to and therefore does need the id.
 */
export default function CompanySettingsRoute() {
  const { t } = useLanguage();
  const [companyId, setCompanyId] = useState<string | null | undefined>(undefined);

  // Read on the client: getActiveCompanyId touches localStorage, which is not
  // there during the server render.
  useEffect(() => { setCompanyId(getActiveCompanyId()); }, []);

  if (companyId === undefined) return <LoadingState label={t("coLoadingCompanies")} />;
  if (!companyId) return <ErrorState message={t("coNotFoundDesc")} />;
  return <CompanySettingsView companyId={companyId} />;
}
