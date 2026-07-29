import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  companyInvitationSchema,
  companyMembershipMutationRequestSchema,
  companyMemberSchema,
  companyRoleAssignmentRequestSchema,
  companyRoleCatalogueSchema,
  companyReadinessAggregateSchema,
  inviteCompanyMemberRequestSchema,
  workspaceAssignmentMutationRequestSchema,
  workspaceRoleMutationRequestSchema,
  type CompanyInvitation,
  type CompanyMember,
  type CompanyReadinessAggregate,
  type WorkspaceAssignmentSummary,
} from '../../contracts/company-admin';
import type {
  AuthSession,
  CompanyRole,
  Permission,
  Workspace,
  WorkspaceMember,
} from '../../contracts/api';
import type { CompanySummary } from '../../contracts/phase2';
import { ROLE_PERMISSIONS } from '../../lib/authorization';
import { apiErrorResponse } from './errors';
import { companySetupReadinessSnapshot } from './company-setup-repository';
import { phase3ReadinessSnapshot } from './phase3-repository';

type CompanyMembershipRecord = {
  companyId: string;
  role: CompanyRole;
  permissions: Permission[];
  status?: 'ACTIVE' | 'INACTIVE';
};

type WorkspaceMembershipRecord = {
  workspaceId: string;
  role: 'MANAGER' | 'OPERATOR' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE';
  permissions: Permission[];
};

export type CompanyAdminUserRecord = {
  userId: string;
  email: string;
  fullName: string;
  suspended: boolean;
  companies: CompanyMembershipRecord[];
  workspaces: WorkspaceMembershipRecord[];
};

export type CompanyAdminCompanyRecord = Record<string, unknown>;

export type CompanyAdminState = {
  companies: CompanyAdminCompanyRecord[];
  users: CompanyAdminUserRecord[];
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  companyInvitations: CompanyInvitation[];
};

const fixtureTime = '2026-07-29T08:30:00.000Z';

export const seedCompanyInvitations: CompanyInvitation[] = [
  {
    invitationId: 'company-invitation-supervisor',
    companyId: 'company-green-valley',
    fullName: 'Maya Thomas',
    email: 'maya.supervisor@navfarm.demo',
    companyRole: 'SUPERVISOR',
    status: 'PENDING',
    invitedAt: '2026-07-27T08:30:00.000Z',
    expiresAt: '2026-08-03T08:30:00.000Z',
    lastSentAt: '2026-07-27T08:30:00.000Z',
  },
  {
    invitationId: 'company-invitation-expired',
    companyId: 'company-green-valley',
    fullName: 'Arjun Mehta',
    email: 'arjun.viewer@navfarm.demo',
    companyRole: 'VIEWER',
    status: 'EXPIRED',
    invitedAt: '2026-07-10T08:30:00.000Z',
    expiresAt: '2026-07-17T08:30:00.000Z',
    lastSentAt: '2026-07-10T08:30:00.000Z',
  },
];

const WORKSPACE_ROLE_PERMISSIONS: Record<
  WorkspaceMembershipRecord['role'],
  Permission[]
> = {
  MANAGER: [
    'workspaces.view',
    'batches.view',
    'batches.create',
    'batches.approve',
    'batches.close',
    'operations.create',
    'costs.view',
    'quality.view',
    'quality.manage',
    'traceability.view',
    'traceability.manage',
    'resources.view',
    'resources.manage',
    'reports.export',
  ],
  OPERATOR: [
    'workspaces.view',
    'batches.view',
    'batches.create',
    'operations.create',
    'quality.view',
    'traceability.view',
    'resources.view',
  ],
  VIEWER: [
    'workspaces.view',
    'batches.view',
    'quality.view',
    'traceability.view',
    'resources.view',
  ],
};

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status });
}

async function body(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) return {};
  return request.json().catch(() => ({}));
}

function companyRecord(
  state: CompanyAdminState,
  companyId: string,
): CompanyAdminCompanyRecord | undefined {
  return state.companies.find((company) => company.company_id === companyId);
}

function companySummary(
  state: CompanyAdminState,
  companyId: string,
): CompanySummary | null {
  const company = companyRecord(state, companyId);
  if (!company) return null;
  const onboardingStatus = String(company.onboarding_status ?? 'NOT_STARTED');
  const complete = onboardingStatus === 'COMPLETED';
  return {
    companyId,
    tenantId: String(company.tenant_id),
    code: String(company.company_code ?? companyId),
    name: String(company.company_display_name ?? company.company_name),
    slug: String(company.slug ?? companyId),
    status: complete ? 'ACTIVE' : 'DRAFT',
    setupPercentage: complete ? 100 : 22,
    workspaceReady: complete,
    operationsReady: complete,
    enabledNobs: [String(company.industry_type ?? 'Unconfigured')],
    enabledModules: Array.isArray(company.enabled_modules)
      ? company.enabled_modules.map(String)
      : [],
    primaryAdministrator: null,
    createdAt: '2026-07-01T08:00:00.000Z',
  };
}

function activeCompanyAccess(
  session: AuthSession,
  companyId: string,
): {
  membership: AuthSession['companies'][number];
  permissions: Set<Permission>;
} | null {
  if (
    session.activeTenantId === null ||
    session.activeCompanyId !== companyId
  ) {
    return null;
  }
  const membership = session.companies.find(
    (company) =>
      company.companyId === companyId &&
      company.tenantId === session.activeTenantId &&
      company.membershipStatus !== 'INACTIVE',
  );
  if (!membership) return null;
  const tenant = session.tenants.find(
    (item) => item.tenantId === session.activeTenantId,
  );
  return {
    membership,
    permissions: new Set([
      ...membership.permissions,
      ...(tenant?.permissions ?? []),
    ]),
  };
}

function requireCapabilities(
  session: AuthSession,
  companyId: string,
  requestId: string,
  required: Permission[],
): NextResponse | null {
  const access = activeCompanyAccess(session, companyId);
  if (!access) {
    return apiErrorResponse(
      403,
      'Active tenant and company membership is required.',
      requestId,
      undefined,
      'COMPANY_MEMBERSHIP_REQUIRED',
    );
  }
  const missing = required.find((permission) => !access.permissions.has(permission));
  if (missing) {
    return apiErrorResponse(
      403,
      `The ${missing} capability is required for this action.`,
      requestId,
      { requiredCapability: missing },
      'CAPABILITY_REQUIRED',
    );
  }
  return null;
}

function workspaceAssignments(
  state: CompanyAdminState,
  user: CompanyAdminUserRecord,
  companyId: string,
): WorkspaceAssignmentSummary[] {
  return user.workspaces.flatMap((membership) => {
    const workspace = state.workspaces.find(
      (item) =>
        item.workspaceId === membership.workspaceId &&
        item.companyId === companyId,
    );
    if (!workspace) return [];
    return [{
      membershipId: `membership-${user.userId}-${workspace.workspaceId}`,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      workspaceSlug: workspace.workspaceSlug,
      workspaceRole: membership.role,
      status: membership.status,
    }];
  });
}

function memberFor(
  state: CompanyAdminState,
  companyId: string,
  user: CompanyAdminUserRecord,
): CompanyMember | null {
  const membership = user.companies.find((item) => item.companyId === companyId);
  if (!membership) return null;
  const assignments = workspaceAssignments(state, user, companyId);
  return companyMemberSchema.parse({
    userId: user.userId,
    companyId,
    fullName: user.fullName,
    email: user.email,
    accountStatus: user.suspended ? 'SUSPENDED' : 'ACTIVE',
    companyRole: membership.role,
    invitationStatus: 'ACCEPTED',
    companyMembershipStatus: membership.status ?? 'ACTIVE',
    assignedWorkspaceCount: assignments.filter(
      (assignment) => assignment.status === 'ACTIVE',
    ).length,
    workspaceAssignments: assignments,
    lastActivityAt: null,
  });
}

function requireMember(
  state: CompanyAdminState,
  companyId: string,
  userId: string,
  requestId: string,
): { user: CompanyAdminUserRecord; member: CompanyMember } | NextResponse {
  const user = state.users.find((item) => item.userId === userId);
  const member = user ? memberFor(state, companyId, user) : null;
  if (!user || !member) {
    return apiErrorResponse(404, 'Company member not found.', requestId);
  }
  return { user, member };
}

function syncWorkspaceMember(
  state: CompanyAdminState,
  user: CompanyAdminUserRecord,
  membership: WorkspaceMembershipRecord,
) {
  const workspaceMember = state.workspaceMembers.find(
    (item) =>
      item.workspaceId === membership.workspaceId &&
      item.userId === user.userId,
  );
  if (workspaceMember) {
    workspaceMember.role = membership.role;
    workspaceMember.status = membership.status;
    return;
  }
  state.workspaceMembers.push({
    membershipId: `membership-${user.userId}-${membership.workspaceId}`,
    workspaceId: membership.workspaceId,
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    role: membership.role,
    status: membership.status,
  });
}

function roleCatalogue(
  state: CompanyAdminState,
  companyId: string,
) {
  const companyDescriptions: Record<CompanyRole, [string, string]> = {
    SUPER_ADMIN: [
      'Super administrator',
      'Founding company administrator with complete company configuration authority.',
    ],
    ADMIN: [
      'Company administrator',
      'Manages company configuration, members, roles, workspaces, masters, and accounting.',
    ],
    FARM_MANAGER: [
      'Farm manager',
      'Views company context. Operational authority requires a separate workspace role.',
    ],
    ACCOUNTANT: [
      'Accountant',
      'Manages company accounting and reads relevant readiness and shared masters.',
    ],
    AUDITOR: [
      'Auditor',
      'Reads documented company, accounting, master-data, and audit information.',
    ],
    SUPERVISOR: [
      'Supervisor',
      'Views company context. Operational duties require an explicit workspace assignment.',
    ],
    VIEWER: [
      'Company viewer',
      'Reads company identity and readiness without company mutation authority.',
    ],
    CUSTOM: [
      'Custom role',
      'Custom company roles are a planned product capability and are unavailable in demo mode.',
    ],
  };
  const companyRoles = (Object.keys(companyDescriptions) as CompanyRole[]).map(
    (code) => ({
      code,
      name: companyDescriptions[code][0],
      description: companyDescriptions[code][1],
      scope: 'COMPANY' as const,
      permissions: ROLE_PERMISSIONS[code],
      memberCount: state.users.filter((user) =>
        user.companies.some(
          (membership) =>
            membership.companyId === companyId &&
            membership.role === code &&
            membership.status !== 'INACTIVE',
        ),
      ).length,
      systemRole: code !== 'CUSTOM',
      assignmentAvailable: !['SUPER_ADMIN', 'CUSTOM'].includes(code),
    }),
  );
  const workspaceDescriptions = {
    MANAGER: 'Manages the assigned workspace and its permitted operational workflows.',
    OPERATOR: 'Records assigned operational work without company administration authority.',
    VIEWER: 'Reads the assigned workspace without mutation authority.',
  } as const;
  const workspaceRoles = (Object.keys(workspaceDescriptions) as Array<
    keyof typeof workspaceDescriptions
  >).map((code) => ({
    code,
    name: code === 'MANAGER' ? 'Workspace manager' :
      code === 'OPERATOR' ? 'Workspace operator' : 'Workspace viewer',
    description: workspaceDescriptions[code],
    scope: 'WORKSPACE' as const,
    permissions: WORKSPACE_ROLE_PERMISSIONS[code],
    memberCount: state.users.reduce(
      (count, user) =>
        count +
        user.workspaces.filter((membership) => {
          const workspace = state.workspaces.find(
            (item) => item.workspaceId === membership.workspaceId,
          );
          return (
            workspace?.companyId === companyId &&
            membership.role === code &&
            membership.status === 'ACTIVE'
          );
        }).length,
      0,
    ),
  }));
  return companyRoleCatalogueSchema.parse({
    companyId,
    companyRoles,
    workspaceRoles,
    customRoles: {
      status: 'PLANNED',
      label: 'Custom company roles',
      description:
        'The final custom-role catalogue and persistence policy remain an unresolved product decision.',
    },
  });
}

function readinessAggregate(
  state: CompanyAdminState,
  companyId: string,
): CompanyReadinessAggregate | null {
  const company = companySummary(state, companyId);
  if (!company) return null;
  const setup = companySetupReadinessSnapshot(company);
  const phase3 = phase3ReadinessSnapshot(companyId);
  const completedSetup = new Set(setup.completed);
  const foundation = [
    ['profile', 'Legal company profile'],
    ['address', 'Registered company address'],
    ['contacts', 'Primary company contact'],
    ['language', 'Default language'],
    ['currency', 'Base currency'],
    ['timezone', 'Company timezone'],
    ['accounting', 'Fiscal configuration'],
    ['modules', 'Enabled company modules'],
    ['administrator', 'Company administrator'],
  ] as const;
  const foundationComplete = foundation.filter(([code]) =>
    completedSetup.has(code),
  );
  const phase3Blockers = new Map<string, (typeof phase3.blockingRequirements)[number]>(
    phase3.blockingRequirements.map((item) => [item.code, item]),
  );
  const masterChecks = [
    ['uoms', 'Required units of measure'],
    ['items', 'Items and categories'],
    ['locations', 'Operating locations'],
    ['parameters', 'Essential operational parameters'],
    ['qc', 'Applicable QC parameters'],
  ] as const;
  const accountingChecks = [
    ['accounts', 'Chart of accounts'],
    ['glMappings', 'Required GL mappings'],
    ['costing', 'Company costing configuration'],
  ] as const;
  const nobLobChecks = [
    ['nob', 'Enabled nature of business'],
    ['lob', 'Enabled line of business'],
  ] as const;
  const companyWorkspaces = state.workspaces.filter(
    (workspace) => workspace.companyId === companyId,
  );
  const activeWorkspaces = companyWorkspaces.filter(
    (workspace) => workspace.status === 'ACTIVE',
  );
  const assignedWorkspaceIds = new Set(
    state.users.flatMap((user) =>
      user.workspaces
        .filter((membership) => membership.status === 'ACTIVE')
        .map((membership) => membership.workspaceId),
    ),
  );

  const sectionForChecks = (
    code: 'SHARED_MASTERS' | 'ACCOUNTING' | 'NOB_LOB',
    title: string,
    description: string,
    checks: ReadonlyArray<readonly [string, string]>,
    route: string,
  ) => {
    const incomplete = checks.filter(([itemCode]) => phase3Blockers.has(itemCode));
    return {
      code,
      title,
      description,
      status: incomplete.length ? 'ACTION_NEEDED' as const : 'READY' as const,
      percentage: Math.round(((checks.length - incomplete.length) / checks.length) * 100),
      completedRequirements: checks
        .filter(([itemCode]) => !phase3Blockers.has(itemCode))
        .map(([, label]) => label),
      incompleteRequirements: incomplete.map(([itemCode, label]) => ({
        code: itemCode,
        label,
        policy: 'BLOCKING' as const,
        route,
      })),
      route,
    };
  };

  const sections = [
    {
      code: 'FOUNDATION' as const,
      title: 'Company foundation',
      description: 'Legal identity and mandatory company-level configuration.',
      status: foundationComplete.length === foundation.length
        ? 'READY' as const
        : 'ACTION_NEEDED' as const,
      percentage: Math.round(
        (foundationComplete.length / foundation.length) * 100,
      ),
      completedRequirements: foundationComplete.map(([, label]) => label),
      incompleteRequirements: foundation
        .filter(([code]) => !completedSetup.has(code))
        .map(([itemCode, label]) => ({
          code: itemCode,
          label,
          policy: 'BLOCKING' as const,
          route: `/${company.slug}/setup/${itemCode === 'administrator' ? 'admin' : itemCode}`,
        })),
      route: `/${company.slug}/profile`,
    },
    {
      code: 'ONBOARDING' as const,
      title: 'Company onboarding',
      description: 'Progress through the documented 15-step company setup catalogue.',
      status: setup.status.setupComplete
        ? 'READY' as const
        : 'IN_PROGRESS' as const,
      percentage: setup.status.setupPercentage,
      completedRequirements: setup.status.steps
        .filter((step) => step.status === 'COMPLETED')
        .map((step) => step.label),
      incompleteRequirements: setup.status.steps
        .filter((step) => step.status !== 'COMPLETED')
        .map((step) => ({
          code: step.id,
          label: step.label,
          policy: step.requiredForWorkspace || step.requiredForOperations
            ? 'BLOCKING' as const
            : 'RECOMMENDED' as const,
          route: `/${company.slug}/setup/${step.route}`,
        })),
      route: `/${company.slug}/setup`,
    },
    sectionForChecks(
      'SHARED_MASTERS',
      'Shared master data',
      'Company-owned UOM, item, location, resource, and parameter foundations.',
      masterChecks,
      `/${company.slug}/masters`,
    ),
    sectionForChecks(
      'ACCOUNTING',
      'Accounting readiness',
      'Dedicated chart-of-accounts, mapping, and costing readiness.',
      accountingChecks,
      `/${company.slug}/accounting/readiness`,
    ),
    {
      code: 'WORKSPACE_CREATION' as const,
      title: 'Workspace creation',
      description: 'Configured business areas beneath this company.',
      status: companyWorkspaces.length ? 'READY' as const : 'INFORMATIONAL' as const,
      percentage: null,
      completedRequirements: companyWorkspaces.length
        ? [`${companyWorkspaces.length} workspace${companyWorkspaces.length === 1 ? '' : 's'} created`]
        : [],
      incompleteRequirements: companyWorkspaces.length
        ? []
        : [{
          code: 'workspace-create',
          label: 'Create the first operational workspace',
          policy: 'RECOMMENDED' as const,
          route: `/${company.slug}/workspaces/new`,
        }],
      route: `/${company.slug}/workspaces`,
    },
    {
      code: 'WORKSPACE_MEMBERSHIP' as const,
      title: 'Workspace membership',
      description: 'Operational access remains explicit for every workspace.',
      status: activeWorkspaces.every((workspace) =>
        assignedWorkspaceIds.has(workspace.workspaceId))
        ? 'READY' as const
        : 'IN_PROGRESS' as const,
      percentage: null,
      completedRequirements: activeWorkspaces
        .filter((workspace) => assignedWorkspaceIds.has(workspace.workspaceId))
        .map((workspace) => `${workspace.workspaceName} has assigned members`),
      incompleteRequirements: activeWorkspaces
        .filter((workspace) => !assignedWorkspaceIds.has(workspace.workspaceId))
        .map((workspace) => ({
          code: `membership-${workspace.workspaceId}`,
          label: `Assign operational access for ${workspace.workspaceName}`,
          policy: 'RECOMMENDED' as const,
          route: `/${company.slug}/members`,
        })),
      route: `/${company.slug}/members`,
    },
    sectionForChecks(
      'NOB_LOB',
      'NOB & LOB configuration',
      'Configured business hierarchy used by company workspaces.',
      nobLobChecks,
      `/${company.slug}/settings/business-structure`,
    ),
  ];

  const workspaces = companyWorkspaces.map((workspace) => {
    const assignedMemberCount = state.users.filter((user) =>
      user.workspaces.some(
        (membership) =>
          membership.workspaceId === workspace.workspaceId &&
          membership.status === 'ACTIVE',
      ),
    ).length;
    const inactive = workspace.status === 'INACTIVE';
    const ready = workspace.status === 'ACTIVE' && workspace.readiness.operationalReady;
    return {
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      workspaceSlug: workspace.workspaceSlug,
      workspaceStatus: workspace.status,
      status: inactive
        ? 'INFORMATIONAL' as const
        : ready
          ? 'READY' as const
          : 'ACTION_NEEDED' as const,
      percentage: inactive ? null : workspace.readiness.percentage,
      completedRequirements: [
        ...(workspace.primaryNobId ? ['Primary NOB assigned'] : []),
        ...(assignedMemberCount ? ['Operational members assigned'] : []),
        ...(ready ? ['Operational readiness checks complete'] : []),
      ],
      incompleteRequirements: inactive
        ? [{
          code: 'workspace-inactive',
          label: 'This workspace is inactive and retained for reference',
          policy: 'INFORMATIONAL' as const,
          route: null,
        }]
        : [
          ...workspace.readiness.blockingRequirements.map((label) => ({
            code: `workspace-${workspace.workspaceId}-${label.toLowerCase().replaceAll(' ', '-')}`,
            label,
            policy: 'BLOCKING' as const,
            route: `/${company.slug}/workspaces/${workspace.workspaceSlug}`,
          })),
          ...(!assignedMemberCount ? [{
            code: `workspace-${workspace.workspaceId}-membership`,
            label: 'Assign at least one operational member',
            policy: 'RECOMMENDED' as const,
            route: `/${company.slug}/members`,
          }] : []),
        ],
      assignedMemberCount,
      route: `/${company.slug}/workspaces/${workspace.workspaceSlug}`,
    };
  });
  const actionNeeded = sections.some(
    (section) => section.status === 'ACTION_NEEDED',
  );
  const workspaceAttention = workspaces.some(
    (workspace) => workspace.status === 'ACTION_NEEDED',
  );
  return companyReadinessAggregateSchema.parse({
    companyId,
    companyName: company.name,
    recalculatedAt: fixtureTime,
    overallStatus: actionNeeded
      ? 'ACTION_NEEDED'
      : workspaceAttention
        ? 'IN_PROGRESS'
        : 'READY',
    sections,
    workspaces,
    policyNotes: [
      {
        code: 'accounting-operational-gate',
        label:
          'Whether accounting readiness blocks every operational write or only close/finalisation remains unresolved.',
        policy: 'POLICY_PENDING',
        route: null,
      },
      {
        code: 'custom-readiness-rules',
        label:
          'Industry-specific readiness rules beyond the documented mock checks remain a product decision.',
        policy: 'POLICY_PENDING',
        route: null,
      },
    ],
  });
}

export async function handleCompanyAdminRequest(
  request: Request,
  path: string,
  requestId: string,
  session: AuthSession,
  state: CompanyAdminState,
): Promise<NextResponse | null> {
  const companyMatch = path.match(/^\/companies\/([^/]+)\/(members|invitations|roles|readiness)(?:\/(.*))?$/);
  if (!companyMatch) return null;
  const [, companyId, resource, suffix = ''] = companyMatch;
  if (!companyRecord(state, companyId)) {
    return apiErrorResponse(404, 'Company not found.', requestId);
  }
  const method = request.method;

  if (resource === 'readiness') {
    const denied = requireCapabilities(
      session,
      companyId,
      requestId,
      ['company.view'],
    );
    if (denied) return denied;
    if (method !== 'GET' || suffix) return apiErrorResponse(404, 'Company readiness resource not found.', requestId);
    const aggregate = readinessAggregate(state, companyId);
    return aggregate
      ? json(aggregate)
      : apiErrorResponse(404, 'Company readiness resource not found.', requestId);
  }

  if (resource === 'roles') {
    const denied = requireCapabilities(
      session,
      companyId,
      requestId,
      ['roles.view'],
    );
    if (denied) return denied;
    if (method !== 'GET' || suffix) return apiErrorResponse(404, 'Company role resource not found.', requestId);
    return json(roleCatalogue(state, companyId));
  }

  if (resource === 'invitations') {
    const readDenied = requireCapabilities(
      session,
      companyId,
      requestId,
      [method === 'GET' ? 'users.view' : 'users.manage'],
    );
    if (readDenied) return readDenied;
    if (method === 'GET' && !suffix) {
      return json(
        state.companyInvitations.filter(
          (invitation) => invitation.companyId === companyId,
        ),
      );
    }
    if (method === 'POST' && !suffix) {
      const parsed = inviteCompanyMemberRequestSchema.safeParse(await body(request));
      if (!parsed.success) {
        return apiErrorResponse(
          422,
          'Review the invitation details.',
          requestId,
          parsed.error.flatten(),
          'VALIDATION_ERROR',
        );
      }
      const duplicateMember = state.users.some(
        (user) =>
          user.email === parsed.data.email &&
          user.companies.some((membership) => membership.companyId === companyId),
      );
      const duplicateInvitation = state.companyInvitations.some(
        (invitation) =>
          invitation.companyId === companyId &&
          invitation.email === parsed.data.email &&
          invitation.status === 'PENDING',
      );
      if (duplicateMember || duplicateInvitation) {
        return apiErrorResponse(
          409,
          'This email already has company membership or a pending invitation.',
          requestId,
        );
      }
      const created = companyInvitationSchema.parse({
        invitationId: `company-invitation-${randomUUID()}`,
        companyId,
        ...parsed.data,
        status: 'PENDING',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastSentAt: new Date().toISOString(),
      });
      state.companyInvitations.push(created);
      return json(created, 201);
    }
    const invitationMatch = suffix.match(/^([^/]+)(?:\/(resend))?$/);
    const invitation = invitationMatch
      ? state.companyInvitations.find(
        (item) =>
          item.invitationId === invitationMatch[1] &&
          item.companyId === companyId,
      )
      : undefined;
    if (!invitation) {
      return apiErrorResponse(404, 'Company invitation not found.', requestId);
    }
    if (method === 'POST' && invitationMatch?.[2] === 'resend') {
      if (invitation.status !== 'PENDING') {
        return apiErrorResponse(409, 'Only pending invitations can be resent.', requestId);
      }
      invitation.lastSentAt = new Date().toISOString();
      invitation.expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      return json(invitation);
    }
    if (method === 'DELETE' && !invitationMatch?.[2]) {
      if (invitation.status !== 'PENDING') {
        return apiErrorResponse(409, 'Only pending invitations can be cancelled.', requestId);
      }
      invitation.status = 'CANCELLED';
      state.companyInvitations = state.companyInvitations.filter(
        (item) => item.invitationId !== invitation.invitationId,
      );
      return json(invitation);
    }
    return apiErrorResponse(404, 'Company invitation action not found.', requestId);
  }

  const listDenied = requireCapabilities(
    session,
    companyId,
    requestId,
    ['users.view'],
  );
  if (listDenied) return listDenied;

  if (method === 'GET' && !suffix) {
    return json({
      items: state.users.flatMap((user) => {
        const member = memberFor(state, companyId, user);
        return member ? [member] : [];
      }),
      invitations: state.companyInvitations.filter(
        (invitation) => invitation.companyId === companyId,
      ),
    });
  }

  const [userId, child, childId] = suffix.split('/');
  const memberResult = requireMember(state, companyId, userId, requestId);
  if (memberResult instanceof NextResponse) return memberResult;
  const { user } = memberResult;

  if (method === 'GET' && !child) {
    return json(memberFor(state, companyId, user));
  }
  if (method === 'GET' && child === 'workspace-assignments' && !childId) {
    return json(workspaceAssignments(state, user, companyId));
  }
  if (method === 'PATCH' && child === 'role' && !childId) {
    const denied = requireCapabilities(
      session,
      companyId,
      requestId,
      ['users.manage', 'roles.manage'],
    );
    if (denied) return denied;
    const parsed = companyRoleAssignmentRequestSchema.safeParse(await body(request));
    if (!parsed.success || parsed.data.companyRole === 'SUPER_ADMIN') {
      return apiErrorResponse(
        422,
        'Select an assignable standard company role.',
        requestId,
        parsed.success ? undefined : parsed.error.flatten(),
        'VALIDATION_ERROR',
      );
    }
    const membership = user.companies.find((item) => item.companyId === companyId)!;
    membership.role = parsed.data.companyRole;
    membership.permissions = [...ROLE_PERMISSIONS[parsed.data.companyRole]];
    return json(memberFor(state, companyId, user));
  }
  if (method === 'PATCH' && child === 'membership' && !childId) {
    const denied = requireCapabilities(
      session,
      companyId,
      requestId,
      ['users.manage'],
    );
    if (denied) return denied;
    const parsed = companyMembershipMutationRequestSchema.safeParse(await body(request));
    if (!parsed.success) {
      return apiErrorResponse(
        422,
        'Select a valid company membership status.',
        requestId,
        parsed.error.flatten(),
        'VALIDATION_ERROR',
      );
    }
    const membership = user.companies.find((item) => item.companyId === companyId)!;
    membership.status = parsed.data.status;
    return json(memberFor(state, companyId, user));
  }
  if (child === 'workspace-assignments') {
    const denied = requireCapabilities(
      session,
      companyId,
      requestId,
      ['users.manage', 'workspaces.manage'],
    );
    if (denied) return denied;
    if (method === 'POST' && !childId) {
      const parsed = workspaceAssignmentMutationRequestSchema.safeParse(
        await body(request),
      );
      if (!parsed.success) {
        return apiErrorResponse(
          422,
          'Select a workspace and workspace role.',
          requestId,
          parsed.error.flatten(),
          'VALIDATION_ERROR',
        );
      }
      const workspace = state.workspaces.find(
        (item) =>
          item.workspaceId === parsed.data.workspaceId &&
          item.companyId === companyId,
      );
      if (!workspace) {
        return apiErrorResponse(
          403,
          'The selected workspace does not belong to this company.',
          requestId,
          undefined,
          'WORKSPACE_NOT_IN_COMPANY',
        );
      }
      if (user.workspaces.some((item) => item.workspaceId === workspace.workspaceId)) {
        return apiErrorResponse(409, 'This member already has workspace access.', requestId);
      }
      const membership: WorkspaceMembershipRecord = {
        workspaceId: workspace.workspaceId,
        role: parsed.data.workspaceRole,
        status: 'ACTIVE',
        permissions: [...WORKSPACE_ROLE_PERMISSIONS[parsed.data.workspaceRole]],
      };
      user.workspaces.push(membership);
      syncWorkspaceMember(state, user, membership);
      return json(memberFor(state, companyId, user), 201);
    }
    const membership = user.workspaces.find(
      (item) => item.workspaceId === childId,
    );
    const workspace = state.workspaces.find(
      (item) => item.workspaceId === childId && item.companyId === companyId,
    );
    if (!membership || !workspace) {
      return apiErrorResponse(404, 'Workspace assignment not found.', requestId);
    }
    if (method === 'PATCH') {
      const parsed = workspaceRoleMutationRequestSchema.safeParse(await body(request));
      if (!parsed.success) {
        return apiErrorResponse(
          422,
          'Select a valid workspace role.',
          requestId,
          parsed.error.flatten(),
          'VALIDATION_ERROR',
        );
      }
      membership.role = parsed.data.workspaceRole;
      membership.permissions = [
        ...WORKSPACE_ROLE_PERMISSIONS[parsed.data.workspaceRole],
      ];
      syncWorkspaceMember(state, user, membership);
      return json(memberFor(state, companyId, user));
    }
    if (method === 'DELETE') {
      user.workspaces = user.workspaces.filter(
        (item) => item.workspaceId !== childId,
      );
      state.workspaceMembers = state.workspaceMembers.filter(
        (item) =>
          !(item.workspaceId === childId && item.userId === user.userId),
      );
      return json(memberFor(state, companyId, user));
    }
  }
  return apiErrorResponse(404, `No company member handler for ${method} ${path}.`, requestId);
}
