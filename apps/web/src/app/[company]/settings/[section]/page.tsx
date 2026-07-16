import { SettingsWorkspacePage } from '@/modules/farm-demo/workspace-page';

export default async function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <SettingsWorkspacePage section={section} />;
}
