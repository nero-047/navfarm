import {
  companyInvitationSchema,
  companyMemberListResponseSchema,
  companyMemberSchema,
  companyMembershipMutationRequestSchema,
  companyReadinessAggregateSchema,
  companyRoleAssignmentRequestSchema,
  companyRoleCatalogueSchema,
  companySettingsMutationSchema,
  companySettingsSchema,
  inviteCompanyMemberRequestSchema,
  workspaceAssignmentMutationRequestSchema,
  workspaceRoleMutationRequestSchema,
  type CompanyInvitation,
  type CompanyMember,
  type CompanyMemberListResponse,
  type CompanyReadinessAggregate,
  type CompanyRoleCatalogue,
  type CompanySettings,
  type CompanySettingsMutation,
  type InviteCompanyMemberRequest,
} from '../../contracts/company-admin';
import {
  setupProfileSchema,
  type SetupProfile,
} from '../../contracts/phase2';
import {
  workspaceSchema,
  type CompanyRole,
  type Workspace,
} from '../../contracts/api';
import { api, type NavfarmApiClient } from '../../lib/api-client';

const parse = <T>(
  schema: { parse(value: unknown): T },
  value: unknown,
): T => schema.parse(value);

const companyPath = (companyId: string) =>
  `/companies/${encodeURIComponent(companyId)}`;

export function createCompanyAdminClient(client: NavfarmApiClient = api) {
  return {
    getProfile: async (companyId: string): Promise<SetupProfile> =>
      parse(
        setupProfileSchema,
        await client.get(`${companyPath(companyId)}/setup/profile`),
      ),
    updateProfile: async (
      companyId: string,
      input: SetupProfile,
    ): Promise<SetupProfile> =>
      parse(
        setupProfileSchema,
        await client.patch(
          `${companyPath(companyId)}/setup/profile`,
          setupProfileSchema.parse(input),
        ),
      ),
    getSettings: async (companyId: string): Promise<CompanySettings> =>
      parse(
        companySettingsSchema,
        await client.get(`${companyPath(companyId)}/settings`),
      ),
    updateSettings: async (
      companyId: string,
      input: CompanySettingsMutation,
    ): Promise<CompanySettings> =>
      parse(
        companySettingsSchema,
        await client.patch(
          `${companyPath(companyId)}/settings`,
          companySettingsMutationSchema.parse(input),
        ),
      ),
    listMembers: async (
      companyId: string,
    ): Promise<CompanyMemberListResponse> =>
      parse(
        companyMemberListResponseSchema,
        await client.get(`${companyPath(companyId)}/members`),
      ),
    getMember: async (
      companyId: string,
      userId: string,
    ): Promise<CompanyMember> =>
      parse(
        companyMemberSchema,
        await client.get(
          `${companyPath(companyId)}/members/${encodeURIComponent(userId)}`,
        ),
      ),
    inviteMember: async (
      companyId: string,
      input: InviteCompanyMemberRequest,
    ): Promise<CompanyInvitation> =>
      parse(
        companyInvitationSchema,
        await client.post(
          `${companyPath(companyId)}/invitations`,
          inviteCompanyMemberRequestSchema.parse(input),
        ),
      ),
    resendInvitation: async (
      companyId: string,
      invitationId: string,
    ): Promise<CompanyInvitation> =>
      parse(
        companyInvitationSchema,
        await client.post(
          `${companyPath(companyId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
        ),
      ),
    cancelInvitation: async (
      companyId: string,
      invitationId: string,
    ): Promise<CompanyInvitation> =>
      parse(
        companyInvitationSchema,
        await client.delete(
          `${companyPath(companyId)}/invitations/${encodeURIComponent(invitationId)}`,
        ),
      ),
    changeCompanyRole: async (
      companyId: string,
      userId: string,
      companyRole: Exclude<CompanyRole, 'CUSTOM'>,
    ): Promise<CompanyMember> =>
      parse(
        companyMemberSchema,
        await client.patch(
          `${companyPath(companyId)}/members/${encodeURIComponent(userId)}/role`,
          companyRoleAssignmentRequestSchema.parse({ companyRole }),
        ),
      ),
    changeMembershipStatus: async (
      companyId: string,
      userId: string,
      status: 'ACTIVE' | 'INACTIVE',
    ): Promise<CompanyMember> =>
      parse(
        companyMemberSchema,
        await client.patch(
          `${companyPath(companyId)}/members/${encodeURIComponent(userId)}/membership`,
          companyMembershipMutationRequestSchema.parse({ status }),
        ),
      ),
    assignWorkspace: async (
      companyId: string,
      userId: string,
      input: { workspaceId: string; workspaceRole: 'MANAGER' | 'OPERATOR' | 'VIEWER' },
    ): Promise<CompanyMember> =>
      parse(
        companyMemberSchema,
        await client.post(
          `${companyPath(companyId)}/members/${encodeURIComponent(userId)}/workspace-assignments`,
          workspaceAssignmentMutationRequestSchema.parse(input),
        ),
      ),
    changeWorkspaceRole: async (
      companyId: string,
      userId: string,
      workspaceId: string,
      workspaceRole: 'MANAGER' | 'OPERATOR' | 'VIEWER',
    ): Promise<CompanyMember> =>
      parse(
        companyMemberSchema,
        await client.patch(
          `${companyPath(companyId)}/members/${encodeURIComponent(userId)}/workspace-assignments/${encodeURIComponent(workspaceId)}`,
          workspaceRoleMutationRequestSchema.parse({ workspaceRole }),
        ),
      ),
    removeWorkspace: async (
      companyId: string,
      userId: string,
      workspaceId: string,
    ): Promise<CompanyMember> =>
      parse(
        companyMemberSchema,
        await client.delete(
          `${companyPath(companyId)}/members/${encodeURIComponent(userId)}/workspace-assignments/${encodeURIComponent(workspaceId)}`,
        ),
      ),
    getRoles: async (companyId: string): Promise<CompanyRoleCatalogue> =>
      parse(
        companyRoleCatalogueSchema,
        await client.get(`${companyPath(companyId)}/roles`),
      ),
    getReadiness: async (
      companyId: string,
    ): Promise<CompanyReadinessAggregate> =>
      parse(
        companyReadinessAggregateSchema,
        await client.get(`${companyPath(companyId)}/readiness`),
      ),
    listWorkspaces: async (
      tenantId: string,
      companyId: string,
    ): Promise<Workspace[]> =>
      parse(
        workspaceSchema.array(),
        await client.get(
          `/tenants/${encodeURIComponent(tenantId)}/companies/${encodeURIComponent(companyId)}/workspaces`,
        ),
      ),
  };
}

export const companyAdminClient = createCompanyAdminClient();
