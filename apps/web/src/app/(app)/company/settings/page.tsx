"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/states";
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
  const router = useRouter();
  useEffect(() => { router.replace("/company/settings/profile"); }, [router]);
  return <LoadingState label={t("coLoadingCompanies")} />;
}
