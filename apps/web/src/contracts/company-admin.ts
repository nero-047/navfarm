import { z } from 'zod';
import type { RuntimeContract } from './api';
import {
  fiscalSchema,
  localizationSchema,
  moduleSelectionSchema,
  setupNotificationsSchema,
  setupProfileSchema,
  setupStatusSchema,
} from './phase2';
import {
  companyRoleSchema,
  permissionSchema,
  workspaceRoleSchema,
} from './authorization';

export const companyMembershipStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export const accountStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED']);
export const companyInvitationStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'CANCELLED',
]);

export const workspaceAssignmentSummarySchema = z.object({
  membershipId: z.string(),
  workspaceId: z.string(),
  workspaceName: z.string(),
  workspaceSlug: z.string(),
  workspaceRole: workspaceRoleSchema,
  status: z.enum(['ACTIVE', 'INACTIVE']),
}).strict();

export const companyMemberSchema = z.object({
  userId: z.string(),
  companyId: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  accountStatus: accountStatusSchema,
  companyRole: companyRoleSchema,
  invitationStatus: companyInvitationStatusSchema,
  companyMembershipStatus: companyMembershipStatusSchema,
  assignedWorkspaceCount: z.number().int().nonnegative(),
  workspaceAssignments: z.array(workspaceAssignmentSummarySchema),
  lastActivityAt: z.string().datetime().nullable(),
}).strict();

export const companyInvitationSchema = z.object({
  invitationId: z.string(),
  companyId: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  companyRole: companyRoleSchema,
  status: companyInvitationStatusSchema,
  invitedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  lastSentAt: z.string().datetime(),
}).strict();

export const companyMemberListResponseSchema = z.object({
  items: z.array(companyMemberSchema),
  invitations: z.array(companyInvitationSchema),
}).strict();

export const inviteCompanyMemberRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email(),
  companyRole: companyRoleSchema.exclude(['CUSTOM']),
}).strict();

export const companyRoleAssignmentRequestSchema = z.object({
  companyRole: companyRoleSchema.exclude(['CUSTOM']),
}).strict();

export const companyMembershipMutationRequestSchema = z.object({
  status: companyMembershipStatusSchema,
}).strict();

export const workspaceAssignmentMutationRequestSchema = z.object({
  workspaceId: z.string().min(1),
  workspaceRole: workspaceRoleSchema,
}).strict();

export const workspaceRoleMutationRequestSchema = z.object({
  workspaceRole: workspaceRoleSchema,
}).strict();

export const companyRoleDefinitionSchema = z.object({
  code: companyRoleSchema,
  name: z.string(),
  description: z.string(),
  scope: z.literal('COMPANY'),
  permissions: z.array(permissionSchema),
  memberCount: z.number().int().nonnegative(),
  systemRole: z.boolean(),
  assignmentAvailable: z.boolean(),
}).strict();

export const workspaceRoleDefinitionSchema = z.object({
  code: workspaceRoleSchema,
  name: z.string(),
  description: z.string(),
  scope: z.literal('WORKSPACE'),
  permissions: z.array(permissionSchema),
  memberCount: z.number().int().nonnegative(),
}).strict();

export const companyRoleCatalogueSchema = z.object({
  companyId: z.string(),
  companyRoles: z.array(companyRoleDefinitionSchema),
  workspaceRoles: z.array(workspaceRoleDefinitionSchema),
  customRoles: z.object({
    status: z.literal('PLANNED'),
    label: z.string(),
    description: z.string(),
  }).strict(),
}).strict();

export const readinessPolicySchema = z.enum([
  'BLOCKING',
  'RECOMMENDED',
  'INFORMATIONAL',
  'POLICY_PENDING',
]);

export const readinessRequirementSchema = z.object({
  code: z.string(),
  label: z.string(),
  policy: readinessPolicySchema,
  route: z.string().nullable(),
}).strict();

export const companyReadinessSectionSchema = z.object({
  code: z.enum([
    'FOUNDATION',
    'ONBOARDING',
    'SHARED_MASTERS',
    'ACCOUNTING',
    'WORKSPACE_CREATION',
    'WORKSPACE_MEMBERSHIP',
    'NOB_LOB',
  ]),
  title: z.string(),
  description: z.string(),
  status: z.enum(['READY', 'IN_PROGRESS', 'ACTION_NEEDED', 'INFORMATIONAL']),
  percentage: z.number().min(0).max(100).nullable(),
  completedRequirements: z.array(z.string()),
  incompleteRequirements: z.array(readinessRequirementSchema),
  route: z.string(),
}).strict();

export const workspaceOperationalReadinessSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  workspaceSlug: z.string(),
  workspaceStatus: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
  status: z.enum(['READY', 'IN_PROGRESS', 'ACTION_NEEDED', 'INFORMATIONAL']),
  percentage: z.number().min(0).max(100).nullable(),
  completedRequirements: z.array(z.string()),
  incompleteRequirements: z.array(readinessRequirementSchema),
  assignedMemberCount: z.number().int().nonnegative(),
  route: z.string(),
}).strict();

export const companyReadinessAggregateSchema = z.object({
  companyId: z.string(),
  companyName: z.string(),
  recalculatedAt: z.string().datetime(),
  overallStatus: z.enum(['READY', 'IN_PROGRESS', 'ACTION_NEEDED']),
  sections: z.array(companyReadinessSectionSchema),
  workspaces: z.array(workspaceOperationalReadinessSchema),
  policyNotes: z.array(readinessRequirementSchema),
}).strict();

export const companySettingsSchema = z.object({
  companyId: z.string(),
  profile: setupProfileSchema,
  localization: localizationSchema,
  fiscal: fiscalSchema,
  modules: moduleSelectionSchema,
  notifications: setupNotificationsSchema,
  setupStatus: setupStatusSchema,
}).strict();

export const companySettingsMutationSchema = z.object({
  localization: localizationSchema.optional(),
  fiscal: fiscalSchema.optional(),
  modules: moduleSelectionSchema.optional(),
  notifications: setupNotificationsSchema.optional(),
}).strict().refine(
  (value) => Object.keys(value).length === 1,
  'Update exactly one company settings section at a time.',
);

export type CompanyMember = z.infer<typeof companyMemberSchema>;
export type CompanyInvitation = z.infer<typeof companyInvitationSchema>;
export type InviteCompanyMemberRequest = z.infer<
  typeof inviteCompanyMemberRequestSchema
>;
export type CompanyMemberListResponse = z.infer<typeof companyMemberListResponseSchema>;
export type CompanyRoleCatalogue = z.infer<typeof companyRoleCatalogueSchema>;
export type CompanyReadinessAggregate = z.infer<typeof companyReadinessAggregateSchema>;
export type CompanySettings = z.infer<typeof companySettingsSchema>;
export type CompanySettingsMutation = z.infer<typeof companySettingsMutationSchema>;
export type WorkspaceAssignmentSummary = z.infer<typeof workspaceAssignmentSummarySchema>;

export const companyAdminRuntimeContracts: RuntimeContract[] = [
  {
    method: 'GET',
    pattern: /^\/companies\/[^/]+\/members$/,
    response: companyMemberListResponseSchema,
  },
  {
    method: 'GET',
    pattern: /^\/companies\/[^/]+\/members\/[^/]+$/,
    response: companyMemberSchema,
  },
  {
    method: 'PATCH',
    pattern: /^\/companies\/[^/]+\/members\/[^/]+\/role$/,
    response: companyMemberSchema,
  },
  {
    method: 'PATCH',
    pattern: /^\/companies\/[^/]+\/members\/[^/]+\/membership$/,
    response: companyMemberSchema,
  },
  {
    method: 'GET',
    pattern: /^\/companies\/[^/]+\/members\/[^/]+\/workspace-assignments$/,
    response: z.array(workspaceAssignmentSummarySchema),
  },
  {
    method: 'POST',
    pattern: /^\/companies\/[^/]+\/members\/[^/]+\/workspace-assignments$/,
    response: companyMemberSchema,
  },
  {
    method: 'PATCH',
    pattern: /^\/companies\/[^/]+\/members\/[^/]+\/workspace-assignments\/[^/]+$/,
    response: companyMemberSchema,
  },
  {
    method: 'DELETE',
    pattern: /^\/companies\/[^/]+\/members\/[^/]+\/workspace-assignments\/[^/]+$/,
    response: companyMemberSchema,
  },
  {
    method: 'GET',
    pattern: /^\/companies\/[^/]+\/invitations$/,
    response: z.array(companyInvitationSchema),
  },
  {
    method: 'POST',
    pattern: /^\/companies\/[^/]+\/invitations$/,
    response: companyInvitationSchema,
  },
  {
    method: 'POST',
    pattern: /^\/companies\/[^/]+\/invitations\/[^/]+\/resend$/,
    response: companyInvitationSchema,
  },
  {
    method: 'DELETE',
    pattern: /^\/companies\/[^/]+\/invitations\/[^/]+$/,
    response: companyInvitationSchema,
  },
  {
    method: 'GET',
    pattern: /^\/companies\/[^/]+\/roles$/,
    response: companyRoleCatalogueSchema,
  },
  {
    method: 'GET',
    pattern: /^\/companies\/[^/]+\/readiness$/,
    response: companyReadinessAggregateSchema,
  },
  {
    method: 'GET',
    pattern: /^\/companies\/[^/]+\/settings$/,
    response: companySettingsSchema,
  },
  {
    method: 'PATCH',
    pattern: /^\/companies\/[^/]+\/settings$/,
    response: companySettingsSchema,
  },
];
