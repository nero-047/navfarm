import { notFound } from 'next/navigation';
import { CompanySetup } from '../../../../components/phase2/company-setup';
import { SETUP_ROUTES, type SetupRoute } from '../../../../lib/readiness-policy';

export default async function CompanySetupStepPage({ params }: { params: Promise<{ company: string; step: string }> }) {
  const { company, step } = await params;
  if (!SETUP_ROUTES.includes(step as SetupRoute)) notFound();
  return <CompanySetup companySlug={company} step={step as SetupRoute} />;
}
