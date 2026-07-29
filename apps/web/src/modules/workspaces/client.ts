import { z } from 'zod';
import {
  workspaceCreateSchema,
  workspaceMemberCreateSchema,
  workspaceMemberSchema,
  workspaceMasterSchema,
  workspaceSchema,
  workspaceSettingsSchema,
  workspaceUpdateSchema,
  type Workspace,
  type WorkspaceMember,
} from '../../contracts/api';
import { api, type NavfarmApiClient } from '../../lib/api-client';

export type WorkspaceCreateInput = z.infer<typeof workspaceCreateSchema>;
export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;
export type WorkspaceMemberCreateInput = z.infer<typeof workspaceMemberCreateSchema>;

const parse = <T>(schema: { parse(value: unknown): T }, value: unknown) => schema.parse(value);

export function createWorkspaceClient(client: NavfarmApiClient = api) {
  const root = (tenantId: string, companyId: string) =>
    `/tenants/${encodeURIComponent(tenantId)}/companies/${encodeURIComponent(companyId)}/workspaces`;
  return {
    list: async (tenantId: string, companyId: string): Promise<Workspace[]> =>
      parse(workspaceSchema.array(), await client.get(root(tenantId, companyId))),
    create: async (tenantId: string, companyId: string, input: WorkspaceCreateInput): Promise<Workspace> =>
      parse(workspaceSchema, await client.post(root(tenantId, companyId), workspaceCreateSchema.parse(input))),
    get: async (tenantId: string, companyId: string, workspaceId: string): Promise<Workspace> =>
      parse(workspaceSchema, await client.get(`${root(tenantId, companyId)}/${encodeURIComponent(workspaceId)}`)),
    update: async (tenantId: string, companyId: string, workspaceId: string, input: WorkspaceUpdateInput): Promise<Workspace> =>
      parse(workspaceSchema, await client.patch(`${root(tenantId, companyId)}/${encodeURIComponent(workspaceId)}`, workspaceUpdateSchema.parse(input))),
    readiness: async (tenantId: string, companyId: string, workspaceId: string): Promise<Workspace['readiness']> =>
      parse(workspaceSchema.shape.readiness, await client.get(`${root(tenantId, companyId)}/${encodeURIComponent(workspaceId)}/readiness`)),
    members: async (tenantId: string, companyId: string, workspaceId: string): Promise<WorkspaceMember[]> =>
      parse(workspaceMemberSchema.array(), await client.get(`${root(tenantId, companyId)}/${encodeURIComponent(workspaceId)}/members`)),
    addMember: async (tenantId: string, companyId: string, workspaceId: string, input: WorkspaceMemberCreateInput): Promise<WorkspaceMember> =>
      parse(workspaceMemberSchema, await client.post(`${root(tenantId, companyId)}/${encodeURIComponent(workspaceId)}/members`, workspaceMemberCreateSchema.parse(input))),
    settings: async (tenantId: string, companyId: string, workspaceId: string) =>
      parse(workspaceSettingsSchema, await client.get(`${root(tenantId, companyId)}/${encodeURIComponent(workspaceId)}/settings`)),
    masters: async (tenantId: string, companyId: string, workspaceId: string) =>
      parse(workspaceMasterSchema.array(), await client.get(`${root(tenantId, companyId)}/${encodeURIComponent(workspaceId)}/masters`)),
  };
}

export const workspaceClient = createWorkspaceClient();
