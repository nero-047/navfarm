import { notFound } from 'next/navigation';
import {
  CompanySettingsPage,
  type CompanySettingsSection,
} from '@/modules/company-admin/settings-page';

const supportedSections = new Set<CompanySettingsSection>([
  'overview',
  'localization',
  'fiscal',
  'modules',
  'notifications',
]);

export default async function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!supportedSections.has(section as CompanySettingsSection)) {
    notFound();
  }
  return <CompanySettingsPage section={section as CompanySettingsSection} />;
}
