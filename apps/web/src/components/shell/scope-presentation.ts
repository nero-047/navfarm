import type { AppScope } from '../../lib/authorization';

export const SCOPE_PRESENTATION: Record<
  AppScope,
  { label: string; description: string }
> = {
  platform: {
    label: 'Platform administration',
    description: 'NAVFarm control plane',
  },
  tenant: {
    label: 'Tenant administration',
    description: 'Tenant console',
  },
  company: {
    label: 'Company administration',
    description: 'Company configuration',
  },
  workspace: {
    label: 'Workspace operations',
    description: 'Operational workspace',
  },
};

export function scopeLabel(scope: AppScope) {
  return SCOPE_PRESENTATION[scope].label;
}
