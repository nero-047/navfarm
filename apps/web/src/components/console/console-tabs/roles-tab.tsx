import React, { useState, useEffect } from 'react';
import Card from '../../ui/card';
import Button from '../../ui/button';
import Input from '../../ui/input';
import {
  ShieldAlert,
  Plus,
  Save,
  RefreshCw,
  Edit3,
  Trash2,
} from 'lucide-react';
import { api } from '../../../services/api-client';
import { Dialog } from '../../ui/dialog';

interface RolesTabProps {
  roles: any[];
  companyId: string;
  onRefreshRoles: () => Promise<void>;
  actionError: string;
  actionSuccess: string;
  setActionError: (msg: string) => void;
  setActionSuccess: (msg: string) => void;
}

// Kept in sync with every @RequirePermission(moduleCode, resource, action) call
// across apps/api/src/modules — this list is what a role can actually be
// granted. A resource with no backend enforcement has no business appearing
// here: checking its box would look like it does something and wouldn't.
const DEFAULT_RESOURCES = [
  // AUDIT
  { module_code: 'AUDIT', resource: 'LOGS', name: 'Audit Logs & Trails' },
  // COMPANY
  { module_code: 'COMPANY', resource: 'SETTINGS', name: 'Company Profiles' },
  // FINANCE (Phase 4)
  { module_code: 'FINANCE', resource: 'JOURNAL', name: 'Journal Entries' },
  { module_code: 'FINANCE', resource: 'REPORTS', name: 'Financial Reports' },
  // INVENTORY (Phase 3)
  {
    module_code: 'INVENTORY',
    resource: 'GOODS_RECEIPT',
    name: 'Goods Receipt',
  },
  { module_code: 'INVENTORY', resource: 'GOODS_ISSUE', name: 'Goods Issue' },
  {
    module_code: 'INVENTORY',
    resource: 'STOCK_TRANSFER',
    name: 'Stock Transfer',
  },
  {
    module_code: 'INVENTORY',
    resource: 'STOCK_ADJUSTMENT',
    name: 'Stock Adjustment',
  },
  { module_code: 'INVENTORY', resource: 'LEDGER', name: 'Inventory Ledger' },
  {
    module_code: 'INVENTORY',
    resource: 'BIO_ASSET_LEDGER',
    name: 'Bio-Asset Ledger',
  },
  // MASTER_DATA (Phase 2)
  { module_code: 'MASTER_DATA', resource: 'UOM', name: 'Units of Measure' },
  { module_code: 'MASTER_DATA', resource: 'SPECIES', name: 'Species' },
  { module_code: 'MASTER_DATA', resource: 'BREED', name: 'Breeds' },
  { module_code: 'MASTER_DATA', resource: 'FARM', name: 'Farms' },
  { module_code: 'MASTER_DATA', resource: 'WAREHOUSE', name: 'Warehouses' },
  { module_code: 'MASTER_DATA', resource: 'SHED', name: 'Sheds' },
  { module_code: 'MASTER_DATA', resource: 'LOCATION', name: 'Locations' },
  {
    module_code: 'MASTER_DATA',
    resource: 'ITEM_CATEGORY',
    name: 'Item Categories',
  },
  { module_code: 'MASTER_DATA', resource: 'ITEM', name: 'Items' },
  {
    module_code: 'MASTER_DATA',
    resource: 'ITEM_ATTRIBUTE',
    name: 'Item Attributes',
  },
  { module_code: 'MASTER_DATA', resource: 'SUPPLIER', name: 'Suppliers' },
  { module_code: 'MASTER_DATA', resource: 'CUSTOMER', name: 'Customers' },
  {
    module_code: 'MASTER_DATA',
    resource: 'RESOURCE',
    name: 'Resources (Labor/Equipment)',
  },
  { module_code: 'MASTER_DATA', resource: 'DISEASE', name: 'Diseases' },
  { module_code: 'MASTER_DATA', resource: 'MEDICINE', name: 'Medicines' },
  {
    module_code: 'MASTER_DATA',
    resource: 'FEED_FORMULA',
    name: 'Feed Formulas',
  },
  { module_code: 'MASTER_DATA', resource: 'GL_ACCOUNT', name: 'GL Accounts' },
  { module_code: 'MASTER_DATA', resource: 'GL_MAPPING', name: 'GL Mappings' },
  { module_code: 'MASTER_DATA', resource: 'COST_CENTER', name: 'Cost Centers' },
  // NOTIFICATION
  {
    module_code: 'NOTIFICATION',
    resource: 'SETTINGS',
    name: 'Notification Gateway Settings',
  },
  // PRODUCTION (Phase 5)
  { module_code: 'PRODUCTION', resource: 'BATCH', name: 'Production Batches' },
  // PRODUCTION (Phase 6)
  {
    module_code: 'PRODUCTION',
    resource: 'PARAMETER',
    name: 'Production Parameters',
  },
  {
    module_code: 'PRODUCTION',
    resource: 'SCHEDULER',
    name: 'Production Schedulers',
  },
  // PRODUCTION (QC/QR)
  {
    module_code: 'PRODUCTION',
    resource: 'QC_PARAMETER',
    name: 'QC Parameters',
  },
  { module_code: 'PRODUCTION', resource: 'QC', name: 'QC Inspections' },
  {
    module_code: 'PRODUCTION',
    resource: 'QR_CODE',
    name: 'Traceability Packs (QR)',
  },
  // RBAC
  {
    module_code: 'RBAC',
    resource: 'ROLE',
    name: 'User Roles & Team Management',
  },
  { module_code: 'RBAC', resource: 'USER', name: 'User Accounts' },
];

const S = {
  textPrimary: { color: 'var(--text-primary)' },
  textSecondary: { color: 'var(--text-secondary)' },
  textMuted: { color: 'var(--text-muted)' },
  border: { borderColor: 'var(--border)' },
  surface: { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' },
  surfaceRaised: {
    backgroundColor: 'var(--surface-raised)',
    borderColor: 'var(--border)',
  },
  input: {
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text)',
    borderColor: 'var(--input-border)',
  },
  accent: { color: 'var(--accent)' },
};

export default function RolesTab({
  roles,
  companyId,
  onRefreshRoles,
  setActionError,
  setActionSuccess,
}: RolesTabProps) {
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    roleCode: '',
    roleName: '',
    description: '',
  });
  const [creatingRole, setCreatingRole] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  const handleSelectRole = async (role: any) => {
    setSelectedRole(role);
    setLoadingPerms(true);
    setActionError('');
    try {
      const activeRules = await api.get(`/role/permissions/${role.role_id}`);
      const merged = DEFAULT_RESOURCES.map((def) => {
        const matchingRule = activeRules.find(
          (r: any) =>
            r.module_code === def.module_code && r.resource === def.resource,
        );
        return {
          module_code: def.module_code,
          resource: def.resource,
          name: def.name,
          can_view: matchingRule ? !!matchingRule.can_view : false,
          can_create: matchingRule ? !!matchingRule.can_create : false,
          can_edit: matchingRule ? !!matchingRule.can_edit : false,
          can_delete: matchingRule ? !!matchingRule.can_delete : false,
          can_approve: matchingRule ? !!matchingRule.can_approve : false,
        };
      });
      setPermissions(merged);
    } catch (e) {
      setPermissions(
        DEFAULT_RESOURCES.map((d) => ({
          ...d,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
          can_approve: false,
        })),
      );
    } finally {
      setLoadingPerms(false);
    }
  };

  const visibleRoles = roles.filter(
    (r) =>
      r.role_code !== 'SUPER_ADMIN' && r.role_code !== 'SYSTEM_SUPER_ADMIN',
  );

  // Auto-select first role on load
  useEffect(() => {
    if (visibleRoles.length > 0 && !selectedRole) {
      handleSelectRole(visibleRoles[0]);
    }
  }, [visibleRoles]);

  const handleToggleCheckbox = (index: number, key: string) => {
    const updated = [...permissions];
    updated[index][key] = !updated[index][key];
    setPermissions(updated);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSavingPerms(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.post(`/role/permissions/${selectedRole.role_id}`, {
        permissions: permissions.map((p) => ({
          module_code: p.module_code,
          resource: p.resource,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
          can_approve: p.can_approve,
        })),
      });
      setActionSuccess('Role permission configurations synced successfully!');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update role permissions.');
    } finally {
      setSavingPerms(false);
    }
  };

  // Create
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRole(true);
    setActionError('');
    setActionSuccess('');
    try {
      const created = await api.post('/role/create', { ...newRole, companyId });
      setActionSuccess('RBAC custom role created successfully!');
      setIsCreateModalOpen(false);
      setNewRole({ roleCode: '', roleName: '', description: '' });
      await onRefreshRoles();
      handleSelectRole(created);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to register custom role.');
    } finally {
      setCreatingRole(false);
    }
  };

  // Edit
  const openEditModal = (role: any) => {
    setEditingRole(role);
    setEditName(role.role_name);
    setEditDesc(role.role_description || '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setSavingEdit(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.put(`/role/${editingRole.role_id}`, {
        roleName: editName,
        description: editDesc,
      });
      setActionSuccess('Role updated successfully!');
      setIsEditModalOpen(false);
      setEditingRole(null);
      await onRefreshRoles();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update role.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete
  const handleDeleteRole = async (roleId: string) => {
    setDeletingRole(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.delete(`/role/${roleId}`);
      setActionSuccess('Role deleted successfully!');
      setDeletingRoleId(null);
      if (selectedRole?.role_id === roleId) {
        setSelectedRole(null);
      }
      await onRefreshRoles();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete role.');
    } finally {
      setDeletingRole(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative animate-fade-in">
      {/* Roles List (Left Sidebar) */}
      <div className="md:col-span-4 flex flex-col gap-4">
        <div
          className="flex justify-between items-center pb-3 border-b"
          style={S.border}
        >
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={S.textSecondary}
          >
            Available Scopes
          </span>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-[var(--radius-sm)] shadow-sm cursor-pointer transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="w-3.5 h-3.5" /> Create Role
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {visibleRoles.length === 0 ? (
            <div
              className="p-8 text-center text-xs border border-dashed rounded-[var(--radius-md)]"
              style={{ ...S.surface, ...S.textMuted }}
            >
              No custom roles configured yet.
            </div>
          ) : (
            visibleRoles.map((r) => {
              const isCurrent = selectedRole?.role_id === r.role_id;
              return (
                <div
                  key={r.role_id}
                  className={`p-4 transition-all border rounded-[var(--radius-md)] relative overflow-hidden flex flex-col gap-3 cursor-pointer ${
                    isCurrent ? 'shadow-sm' : 'hover:border-(--accent)'
                  }`}
                  style={{
                    backgroundColor: isCurrent
                      ? 'var(--surface-raised)'
                      : 'var(--surface)',
                    borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                  }}
                  onClick={() => handleSelectRole(r)}
                >
                  {isCurrent && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[4px]"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                  )}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm" style={S.textPrimary}>
                        {r.role_name}
                      </h4>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded font-mono"
                        style={{
                          backgroundColor: 'var(--badge-bg)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {r.role_code}
                      </span>
                    </div>
                    <p
                      className="text-xs mt-1.5 line-clamp-2"
                      style={S.textMuted}
                    >
                      {r.role_description || 'Custom operator scopes'}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-4 pt-2.5 border-t"
                    style={S.border}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEditModal(r)}
                      className="flex items-center gap-1 text-xs cursor-pointer transition-colors font-semibold"
                      style={S.textSecondary}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = 'var(--accent)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'var(--text-secondary)')
                      }
                    >
                      <Edit3 className="w-3 h-3" /> Edit Name
                    </button>
                    {!r.is_system_role && (
                      <button
                        onClick={() => setDeletingRoleId(r.role_id)}
                        className="flex items-center gap-1 text-xs cursor-pointer transition-colors font-semibold text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Permissions matrix */}
      <div className="md:col-span-8">
        {selectedRole ? (
          <Card className="p-6 flex flex-col gap-6" style={S.surface}>
            <div
              className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 gap-4"
              style={S.border}
            >
              <div>
                <h3
                  className="font-bold text-sm flex items-center gap-2"
                  style={S.textPrimary}
                >
                  <ShieldAlert className="w-4 h-4" style={S.accent} />
                  Access Matrix: {selectedRole.role_name}
                </h3>
                <p className="text-xs mt-1 font-mono" style={S.textMuted}>
                  Role ID: {selectedRole.role_id}
                </p>
              </div>
              <Button
                onClick={handleSavePermissions}
                disabled={savingPerms || loadingPerms}
                className="flex items-center gap-1.5 self-start py-2 px-4 font-semibold text-xs text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Save className="w-3.5 h-3.5" />
                {savingPerms ? 'Saving...' : 'Save Policies'}
              </Button>
            </div>

            {loadingPerms ? (
              <div
                className="p-16 text-center flex items-center justify-center gap-2.5"
                style={S.textMuted}
              >
                <RefreshCw className="w-4 h-4 animate-spin" style={S.accent} />
                <span className="text-xs font-medium">
                  Reading permission entries...
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className="border-b text-xs font-bold uppercase tracking-wider"
                      style={{ ...S.border, ...S.textMuted }}
                    >
                      <th className="pb-3 font-semibold">Module Resource</th>
                      {['View', 'Create', 'Edit', 'Delete', 'Approve'].map(
                        (h) => (
                          <th
                            key={h}
                            className="pb-3 text-center w-20 font-semibold"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((p, idx) => (
                      <tr
                        key={idx}
                        className="border-b transition-colors"
                        style={{ ...S.border, ...S.textPrimary }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            'var(--row-hover)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            'transparent')
                        }
                      >
                        <td className="py-3.5 font-semibold">
                          <div style={S.textPrimary}>{p.name}</div>
                          <div
                            className="text-xs font-mono mt-0.5"
                            style={S.textMuted}
                          >
                            {p.module_code} • {p.resource}
                          </div>
                        </td>
                        {[
                          'can_view',
                          'can_create',
                          'can_edit',
                          'can_delete',
                          'can_approve',
                        ].map((key) => (
                          <td key={key} className="py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={p[key]}
                              onChange={() => handleToggleCheckbox(idx, key)}
                              className="w-4 h-4 rounded border text-(--accent) cursor-pointer focus:ring-0 focus:ring-offset-0"
                              style={{
                                backgroundColor: 'var(--input-bg)',
                                borderColor: 'var(--input-border)',
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : (
          <div
            className="text-center p-16 rounded-[var(--radius-md)] border border-dashed flex flex-col items-center justify-center"
            style={{ ...S.surface, ...S.textMuted }}
          >
            <ShieldAlert
              className="w-10 h-10 mb-3 opacity-30 animate-pulse"
              style={S.accent}
            />
            <span className="text-xs font-semibold">
              Select or create a role to define granular resource policies.
            </span>
          </div>
        )}
      </div>

      <Dialog
        open={isCreateModalOpen}
        onClose={() => !creatingRole && setIsCreateModalOpen(false)}
        title="Create custom role"
        description="Define a reusable permission role for this company."
        maxWidth="sm"
      >
        <form onSubmit={handleCreateRoleSubmit} className="flex flex-col gap-4">
          <Input
            label="Role Code"
            placeholder="e.g. FARM_SUPERVISOR"
            value={newRole.roleCode}
            onChange={(e) =>
              setNewRole({ ...newRole, roleCode: e.target.value.toUpperCase() })
            }
            required
          />
          <Input
            label="Role Name"
            placeholder="Farm Supervisor"
            value={newRole.roleName}
            onChange={(e) =>
              setNewRole({ ...newRole, roleName: e.target.value })
            }
            required
          />
          <Input
            label="Description"
            placeholder="Manages coops and biological feeds"
            value={newRole.description}
            onChange={(e) =>
              setNewRole({ ...newRole, description: e.target.value })
            }
          />
          <div
            className="mt-2 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end"
            style={S.border}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="py-2 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creatingRole}
              className="py-2 px-4 text-xs text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {creatingRole ? 'Saving...' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={isEditModalOpen && Boolean(editingRole)}
        onClose={() => !savingEdit && setIsEditModalOpen(false)}
        title="Edit role"
        description={
          editingRole ? `Update ${editingRole.role_code}.` : undefined
        }
        maxWidth="sm"
      >
        {editingRole && (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div className="text-xs font-mono" style={S.textMuted}>
              Role Code: {editingRole.role_code}
            </div>
            <Input
              label="Role Name"
              placeholder="Farm Supervisor"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <Input
              label="Description"
              placeholder="Role description"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
            <div
              className="mt-2 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end"
              style={S.border}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="py-2 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="py-2 px-4 text-xs text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog
        open={Boolean(deletingRoleId)}
        onClose={() => !deletingRole && setDeletingRoleId(null)}
        title="Delete role"
        description="This action cannot be undone."
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="text-xs leading-relaxed" style={S.textSecondary}>
            Are you sure you want to delete this role? This action cannot be
            undone. Any permissions tied to this role will also be removed.
          </div>
          <div
            className="mt-2 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end"
            style={S.border}
          >
            <Button
              variant="outline"
              onClick={() => setDeletingRoleId(null)}
              className="py-2 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deletingRoleId && handleDeleteRole(deletingRoleId)}
              disabled={deletingRole}
              className="py-2 px-4 text-xs text-white bg-rose-500 hover:bg-rose-600"
            >
              {deletingRole ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
