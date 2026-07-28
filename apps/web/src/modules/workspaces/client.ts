import { z } from 'zod';
import {
  workspaceCreateSchema,
  workspaceMemberCreateSchema,
  workspaceMemberSchema,
  workspaceSchema,
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
  return {
    list: async (tenantId: string, companyId: string): Promise<Workspace[]> =>
      parse(workspaceSchema.array(), await client.get(`/tenants/${encodeURIComponent(tenantId)}/companies/${encodeURIComponent(companyId)}/workspaces`)),
    create: async (tenantId: string, companyId: string, input: WorkspaceCreateInput): Promise<Workspace> =>
      parse(workspaceSchema, await client.post(`/tenants/${encodeURIComponent(tenantId)}/companies/${encodeURIComponent(companyId)}/workspaces`, workspaceCreateSchema.parse(input))),
    get: async (companyId: string, workspaceId: string): Promise<Workspace> =>
      parse(workspaceSchema, await client.get(`/companies/${encodeURIComponent(companyId)}/workspaces/${encodeURIComponent(workspaceId)}`)),
    update: async (companyId: string, workspaceId: string, input: WorkspaceUpdateInput): Promise<Workspace> =>
      parse(workspaceSchema, await client.patch(`/companies/${encodeURIComponent(companyId)}/workspaces/${encodeURIComponent(workspaceId)}`, workspaceUpdateSchema.parse(input))),
    readiness: async (companyId: string, workspaceId: string): Promise<Workspace['readiness']> =>
      parse(workspaceSchema.shape.readiness, await client.get(`/companies/${encodeURIComponent(companyId)}/workspaces/${encodeURIComponent(workspaceId)}/readiness`)),
    members: async (companyId: string, workspaceId: string): Promise<WorkspaceMember[]> =>
      parse(workspaceMemberSchema.array(), await client.get(`/companies/${encodeURIComponent(companyId)}/workspaces/${encodeURIComponent(workspaceId)}/members`)),
    addMember: async (companyId: string, workspaceId: string, input: WorkspaceMemberCreateInput): Promise<WorkspaceMember> =>
      parse(workspaceMemberSchema, await client.post(`/companies/${encodeURIComponent(companyId)}/workspaces/${encodeURIComponent(workspaceId)}/members`, workspaceMemberCreateSchema.parse(input))),
  };
}

export const workspaceClient = createWorkspaceClient();
