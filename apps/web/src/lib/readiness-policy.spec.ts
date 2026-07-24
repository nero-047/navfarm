import { COMPANY_SETUP_STEPS, evaluateReadiness, type ReadinessInput } from './readiness-policy';

function input(completedIds: string[], setupComplete = false): ReadinessInput {
  return {
    companyId: 'company-test',
    setupComplete,
    completed: Object.fromEntries(
      COMPANY_SETUP_STEPS.map((step) => [step.id, completedIds.includes(step.id)]),
    ) as ReadinessInput['completed'],
  };
}

describe('company readiness policy', () => {
  it('unlocks the workspace after steps 1-9 resource groups are complete', () => {
    const status = evaluateReadiness(input(['profile', 'address', 'contacts', 'language', 'currency', 'timezone', 'accounting', 'modules', 'administrator']));
    expect(status.workspaceReady).toBe(true);
    expect(status.operationsReady).toBe(false);
  });

  it('blocks operations until COA/GL, NOB/LOB, and essential masters are ready', () => {
    const status = evaluateReadiness(input(COMPANY_SETUP_STEPS.filter((step) => step.workspace).map((step) => step.id)));
    expect(status.blockingRequirements.filter((item) => item.kind === 'OPERATIONS')).toHaveLength(3);
    expect(status.steps.find((step) => step.id === 'review')?.status).toBe('BLOCKED');
  });

  it('allows setup completion when workspace and operations requirements are met', () => {
    const required = COMPANY_SETUP_STEPS.filter((step) => step.workspace || step.operations).map((step) => step.id);
    const status = evaluateReadiness(input(required, true));
    expect(status.workspaceReady).toBe(true);
    expect(status.operationsReady).toBe(true);
    expect(status.setupComplete).toBe(true);
  });
});
