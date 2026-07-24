import { PlatformPlansView } from '../../../../components/phase2/platform-plans';

export default async function AdminPlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return <PlatformPlansView planId={planId} />;
}
