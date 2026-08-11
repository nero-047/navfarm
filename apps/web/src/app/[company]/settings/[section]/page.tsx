import { SettingsPage } from '@/modules/settings/settings-page';

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <SettingsPage section={section} />;
}
