import type { SetupStatus } from '../contracts/phase2';

export const SETUP_ROUTES = [
  'profile', 'address', 'contacts', 'localization', 'accounting', 'modules',
  'admin', 'team', 'chart-of-accounts', 'business-structure', 'masters',
  'notifications', 'review',
] as const;
export type SetupRoute = (typeof SETUP_ROUTES)[number];

export const COMPANY_SETUP_STEPS = [
  { id: 'profile', number: 1, label: 'Company profile', route: 'profile', workspace: true, operations: false },
  { id: 'address', number: 2, label: 'Address', route: 'address', workspace: true, operations: false },
  { id: 'contacts', number: 3, label: 'Contacts', route: 'contacts', workspace: true, operations: false },
  { id: 'language', number: 4, label: 'Language', route: 'localization', workspace: true, operations: false },
  { id: 'currency', number: 5, label: 'Currency', route: 'localization', workspace: true, operations: false },
  { id: 'timezone', number: 6, label: 'Timezone', route: 'localization', workspace: true, operations: false },
  { id: 'accounting', number: 7, label: 'Fiscal & accounting', route: 'accounting', workspace: true, operations: false },
  { id: 'modules', number: 8, label: 'Modules', route: 'modules', workspace: true, operations: false },
  { id: 'administrator', number: 9, label: 'Company administrator', route: 'admin', workspace: true, operations: false },
  { id: 'team', number: 10, label: 'Team members', route: 'team', workspace: false, operations: false },
  { id: 'chartOfAccounts', number: 11, label: 'Chart of accounts & GL', route: 'chart-of-accounts', workspace: false, operations: true },
  { id: 'businessStructure', number: 12, label: 'NOB & LOB configuration', route: 'business-structure', workspace: false, operations: true },
  { id: 'essentialMasters', number: 13, label: 'Essential master data', route: 'masters', workspace: false, operations: true },
  { id: 'notifications', number: 14, label: 'Notifications', route: 'notifications', workspace: false, operations: false },
  { id: 'review', number: 15, label: 'Review & completion', route: 'review', workspace: false, operations: false },
] as const;

export interface ReadinessInput {
  companyId: string;
  completed: Record<(typeof COMPANY_SETUP_STEPS)[number]['id'], boolean>;
  setupComplete: boolean;
}

export function evaluateReadiness(input: ReadinessInput): SetupStatus {
  const workspaceReady = COMPANY_SETUP_STEPS
    .filter((step) => step.workspace)
    .every((step) => input.completed[step.id]);
  const operationsReady = workspaceReady && COMPANY_SETUP_STEPS
    .filter((step) => step.operations)
    .every((step) => input.completed[step.id]);
  const blockingRequirements = COMPANY_SETUP_STEPS
    .filter((step) => (step.workspace || step.operations) && !input.completed[step.id])
    .map((step) => ({
      code: step.id,
      label: step.label,
      route: step.route,
      kind: step.workspace ? 'WORKSPACE' as const : 'OPERATIONS' as const,
    }));
  const recommendedRequirements = COMPANY_SETUP_STEPS
    .filter((step) => !step.workspace && !step.operations && step.id !== 'review' && !input.completed[step.id])
    .map((step) => ({
      code: step.id,
      label: step.label,
      route: step.route,
      kind: 'OPERATIONS' as const,
    }));
  const completedCount = COMPANY_SETUP_STEPS.filter((step) =>
    step.id === 'review' ? input.setupComplete : input.completed[step.id],
  ).length;
  const current = COMPANY_SETUP_STEPS.find((step) => !input.completed[step.id]);
  return {
    companyId: input.companyId,
    setupPercentage: Math.round((completedCount / COMPANY_SETUP_STEPS.length) * 100),
    workspaceReady,
    operationsReady,
    setupComplete: input.setupComplete,
    blockingRequirements,
    recommendedRequirements,
    steps: COMPANY_SETUP_STEPS.map((step) => {
      const blocked = (step.operations && !workspaceReady) || (step.id === 'review' && (!workspaceReady || !operationsReady));
      return {
        id: step.id,
        number: step.number,
        label: step.label,
        route: step.route,
        status: input.completed[step.id] || (step.id === 'review' && input.setupComplete)
          ? 'COMPLETED'
          : blocked
            ? 'BLOCKED'
            : current?.id === step.id
              ? 'CURRENT'
              : 'PENDING',
        requiredForWorkspace: step.workspace,
        requiredForOperations: step.operations,
      };
    }),
  };
}
