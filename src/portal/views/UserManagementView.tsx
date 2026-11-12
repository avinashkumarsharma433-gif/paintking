import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Edit3,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { usePortalStore } from '../context/PortalStoreContext';
import { PlantLocation, PortalUserAccount, UserRole } from '../types/portalTypes';
import { fetchAllPortalUsers, invokeAdminUsersFunction } from '../lib/supabaseClient';
import {
  ALL_STANDARD_MODULE_IDS,
  ERP_MODULE_CATALOG,
  normalizePortalEmail,
  ROLE_PRESETS,
} from '../utils/portalAuth';

const PLANT_OPTIONS: Array<{ value: PlantLocation | 'ALL'; label: string }> = [
  { value: 'Haridwar', label: 'Haridwar Plant' },
  { value: 'Vasai', label: 'Vasai Plant' },
  { value: 'Vapi', label: 'Vapi Plant' },
  { value: 'Mumbai', label: 'Mumbai Head Office' },
  { value: 'ALL', label: 'All Plants (Multi-Unit)' },
];

const ROLE_OPTIONS = Object.entries(ROLE_PRESETS) as Array<
  [UserRole, { label: string; defaultTitle: string; defaultModules: string[] }]
>;

export const UserManagementView: React.FC = () => {
  const { currentUser } = usePortalStore();

  const [users, setUsers] = useState<PortalUserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showDeployHint, setShowDeployHint] = useState(false);

  // Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<PortalUserAccount | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserRole>('STORES');
  const [roleTitleInput, setRoleTitleInput] = useState(ROLE_PRESETS.STORES.defaultTitle);
  const [plantInput, setPlantInput] = useState<PlantLocation | 'ALL'>('Haridwar');
  const [allowedModulesInput, setAllowedModulesInput] = useState<string[]>(ROLE_PRESETS.STORES.defaultModules);
  const [isActiveInput, setIsActiveInput] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    setLoadError(null);
    const res = await fetchAllPortalUsers();
    if (res.error) {
      setLoadError(res.error);
    } else {
      setUsers(res.users);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setModalError(null);
    setFullName('');
    setLoginEmailInput('');
    setPasswordInput('');
    setRoleInput('STORES');
    setRoleTitleInput(ROLE_PRESETS.STORES.defaultTitle);
    setPlantInput('Haridwar');
    setAllowedModulesInput([...ROLE_PRESETS.STORES.defaultModules]);
    setIsActiveInput(true);
    setShowUserModal(true);
  };

  const openEditModal = (account: PortalUserAccount) => {
    setEditingUser(account);
    setModalError(null);
    setFullName(account.fullName);
    setLoginEmailInput(account.email);
    setPasswordInput('');
    setRoleInput(account.role);
    setRoleTitleInput(account.roleTitle);
    setPlantInput(account.plant);
    setAllowedModulesInput([...account.allowedModules]);
    setIsActiveInput(account.isActive);
    setShowUserModal(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRoleInput(newRole);
    const preset = ROLE_PRESETS[newRole];
    if (preset) {
      setRoleTitleInput(preset.defaultTitle);
      setAllowedModulesInput([...preset.defaultModules]);
      if (newRole === 'SUPER_ADMIN' || newRole === 'DIRECTOR') {
        setPlantInput('ALL');
      }
    }
  };

  const toggleModulePermission = (moduleId: string) => {
    if (moduleId === 'user_management' && roleInput !== 'SUPER_ADMIN') {
      return;
    }
    setAllowedModulesInput(prev =>
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const normalizedEmail = normalizePortalEmail(loginEmailInput);
    if (!editingUser && (!normalizedEmail || !normalizedEmail.endsWith('@paintking.in'))) {
      setModalError('Login ID must end with @paintking.in (e.g. ram.gate@paintking.in).');
      return;
    }
    if (!fullName.trim()) {
      setModalError('Full Name is required.');
      return;
    }
    if (!editingUser && passwordInput.trim().length < 8) {
      setModalError('Initial password must be at least 8 characters.');
      return;
    }
    if (editingUser && passwordInput.trim().length > 0 && passwordInput.trim().length < 8) {
      setModalError('New password must be at least 8 characters.');
      return;
    }
    if (allowedModulesInput.length === 0) {
      setModalError('Select at least 1 ERP module for this account.');
      return;
    }

    const finalModules =
      roleInput === 'SUPER_ADMIN'
        ? Array.from(new Set([...allowedModulesInput, 'user_management']))
        : allowedModulesInput.filter(m => m !== 'user_management');

    setIsSaving(true);
    try {
      const res = await invokeAdminUsersFunction(
        editingUser
          ? {
              action: 'update_user',
              userId: editingUser.id,
              fullName: fullName.trim(),
              role: roleInput,
              roleTitle: roleTitleInput.trim() || ROLE_PRESETS[roleInput].defaultTitle,
              plant: plantInput,
              allowedModules: finalModules,
              isActive: isActiveInput,
              password: passwordInput.trim() || undefined,
            }
          : {
              action: 'create_user',
              email: normalizedEmail,
              password: passwordInput.trim(),
              fullName: fullName.trim(),
              role: roleInput,
              roleTitle: roleTitleInput.trim() || ROLE_PRESETS[roleInput].defaultTitle,
              plant: plantInput,
              allowedModules: finalModules,
              isActive: isActiveInput,
            }
      );

      if (!res.success) {
        if (res.edgeFunctionMissing) {
          setShowDeployHint(true);
        }
        setModalError(res.error || 'Failed to save user account.');
        return;
      }

      setShowUserModal(false);
      showToast(
        editingUser
          ? `Updated permissions & profile for ${fullName.trim()}.`
          : `Created login account ${normalizedEmail}.`
      );
      await loadUsers();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (account: PortalUserAccount) => {
    if (account.id === currentUser.id) {
      showToast('You cannot deactivate your own active Super Admin session.');
      return;
    }
    const res = await invokeAdminUsersFunction({
      action: 'update_user',
      userId: account.id,
      isActive: !account.isActive,
    });
    if (!res.success) {
      if (res.edgeFunctionMissing) setShowDeployHint(true);
      showToast(res.error || 'Unable to update status.');
      return;
    }
    showToast(`${account.fullName} marked ${!account.isActive ? 'Active' : 'Suspended'}.`);
    await loadUsers();
  };

  const handleDeleteUser = async (account: PortalUserAccount) => {
    if (account.id === currentUser.id) {
      showToast('You cannot delete your own active Super Admin account.');
      return;
    }
    if (!window.confirm(`Permanently delete login account "${account.email}" (${account.fullName})?`)) {
      return;
    }
    const res = await invokeAdminUsersFunction({
      action: 'delete_user',
      userId: account.id,
    });
    if (!res.success) {
      if (res.edgeFunctionMissing) setShowDeployHint(true);
      showToast(res.error || 'Unable to delete account.');
      return;
    }
    showToast(`Deleted account ${account.email}.`);
    await loadUsers();
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.plant.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const activeCount = users.filter(u => u.isActive).length;
  const suspendedCount = users.filter(u => !u.isActive).length;
  const coveredPlantsCount = new Set(users.map(u => u.plant)).size;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#faf3e0] text-[#8a6521] px-4 py-2.5 rounded-full shadow-lg border border-[#f4e5be] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#c09748]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#ececec] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-SYS-USR-001 • SUPER ADMIN CONSOLE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              @paintking.in Access Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Users, Plant Assignment &amp; Module Permissions
          </h1>
          <p className="text-xs text-[#777b86] mt-0.5">
            Create staff login accounts, assign their operating plant, and choose exact ERP modules each person can access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            className="px-3.5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Staff Account</span>
          </button>
        </div>
      </div>

      {/* Edge Function Deploy Hint (Shown only if admin-users edge function is not yet deployed) */}
      {showDeployHint && (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 text-xs text-amber-950 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Supabase Edge Function &quot;admin-users&quot; Not Deployed Yet</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDeployHint(false)}
              className="text-amber-800 hover:text-amber-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-amber-900">
            To create/reset staff accounts securely without exposing admin keys in the browser, deploy{' '}
            <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono">supabase/functions/admin-users/index.ts</code>{' '}
            by running: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono">npx supabase functions deploy admin-users</code>
          </p>
        </div>
      )}

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Total Portal Accounts</div>
            <div className="text-2xl font-serif font-normal text-[#17191c] mt-1">{users.length}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center">
            <Users className="w-5 h-5 text-[#c09748]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Active / Locked</div>
            <div className="text-2xl font-serif font-normal text-emerald-700 mt-1">
              {activeCount} <span className="text-sm text-[#777b86]">/ {suspendedCount} locked</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Assigned Plants</div>
            <div className="text-2xl font-serif font-normal text-[#17191c] mt-1">{coveredPlantsCount} Units</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#f2f2f3] border border-[#ececec] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#17191c]" />
          </div>
        </div>
      </div>

      {/* Main Directory Card (4-Column Rule on Desktop + Mobile Cards) */}
      <div className="bg-white rounded-[24px] border border-[#ececec] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-serif font-medium text-[#17191c]">
              Authorized Staff Directory ({filteredUsers.length})
            </h2>
            <p className="text-xs text-[#777b86]">
              Only active accounts listed here can access ERP data under Supabase Row-Level Security.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#777b86] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name, @paintking.in, plant..."
              className="w-full h-9 pl-9 pr-3 rounded-full border border-[#dcdfe4] bg-[#fafafb] text-xs text-[#17191c] focus:bg-white focus:border-[#c09748] focus:outline-none"
            />
          </div>
        </div>

        {loadError && (
          <div className="p-4 m-4 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            Error loading users: {loadError}
          </div>
        )}

        {/* Desktop 4-Column Summary Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafb] border-b border-[#ececec] text-[10px] font-mono uppercase tracking-wider text-[#777b86]">
                <th className="py-3 px-5 font-bold">1. Staff &amp; Login ID</th>
                <th className="py-3 px-4 font-bold">2. Role &amp; Plant</th>
                <th className="py-3 px-4 font-bold">3. Module Access</th>
                <th className="py-3 px-5 font-bold text-right">4. Status &amp; Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f2f3] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-[#777b86]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#c09748]" />
                    Loading authorized staff directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-[#777b86]">
                    No matching staff accounts found. Click &quot;Create Staff Account&quot; to add your team.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(account => (
                  <tr key={account.id} className="hover:bg-[#fafafb] transition">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#17191c]">{account.fullName}</div>
                      <div className="text-[11px] font-mono text-[#777b86] mt-0.5">{account.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold">
                          {account.role}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#f2f2f3] text-[#17191c] text-[10px] font-semibold">
                          {account.plant === 'ALL' ? 'All Plants' : account.plant}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#777b86] mt-1">{account.roleTitle}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-[#17191c]">
                        {account.role === 'SUPER_ADMIN'
                          ? 'Full Root Access (All Modules)'
                          : `${account.allowedModules.length} Modules Enabled`}
                      </div>
                      <div className="text-[10px] text-[#777b86] truncate max-w-[240px] mt-0.5">
                        {account.allowedModules
                          .map(mId => ERP_MODULE_CATALOG.find(m => m.id === mId)?.label || mId)
                          .join(', ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            account.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {account.isActive ? 'Active' : 'Suspended'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditModal(account)}
                          className="px-3 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 active:scale-95"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        {account.id !== currentUser.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(account)}
                              className="p-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] transition cursor-pointer"
                              title={account.isActive ? 'Suspend access' : 'Reactivate access'}
                            >
                              {account.isActive ? <UserX className="w-3.5 h-3.5 text-amber-700" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-700" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(account)}
                              className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                              title="Delete account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (<640px) */}
        <div className="sm:hidden p-3 space-y-3">
          {filteredUsers.map(account => (
            <div key={account.id} className="bg-[#fafafb] rounded-[18px] border border-[#ececec] p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[#17191c] truncate">{account.fullName}</div>
                  <div className="text-[11px] font-mono text-[#777b86] truncate">{account.email}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                    account.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {account.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] font-mono font-bold">
                  {account.role}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#ececec] text-[#17191c] font-semibold">
                  {account.plant === 'ALL' ? 'All Plants' : account.plant}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#ececec] text-[#777b86]">
                  {account.allowedModules.length} Modules
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => openEditModal(account)}
                  className="px-3 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Access</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Staff Account Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] border border-[#ececec] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#ececec] flex items-center justify-between bg-[#fafafb]">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c09748]">
                  {editingUser ? 'MODIFY ACCOUNT & PERMISSIONS' : 'PROVISION NEW @PAINTKING.IN LOGIN'}
                </div>
                <h2 className="text-xl font-serif font-normal text-[#17191c] mt-0.5">
                  {editingUser ? `Edit ${editingUser.fullName}` : 'Create Staff Account'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="p-2 rounded-full hover:bg-[#f2f2f3] text-[#777b86] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Manoj Tiwari"
                    className="w-full h-10 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                    Login ID (@paintking.in) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={loginEmailInput}
                    onChange={e => setLoginEmailInput(e.target.value)}
                    placeholder="e.g. manoj.stores"
                    className="w-full h-10 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] disabled:opacity-60 focus:bg-white text-xs text-[#17191c] font-mono focus:border-[#c09748] focus:outline-none"
                  />
                  {!editingUser && loginEmailInput.trim() && (
                    <div className="text-[10px] font-mono text-[#8a6521]">
                      Email ID: <strong>{normalizePortalEmail(loginEmailInput)}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                    Role Preset *
                  </label>
                  <select
                    value={roleInput}
                    onChange={e => handleRoleChange(e.target.value as UserRole)}
                    className="w-full h-10 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  >
                    {ROLE_OPTIONS.map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label} ({key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                    Assigned Plant *
                  </label>
                  <select
                    value={plantInput}
                    onChange={e => setPlantInput(e.target.value as PlantLocation | 'ALL')}
                    className="w-full h-10 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  >
                    {PLANT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                    Profile Title / Designation
                  </label>
                  <input
                    type="text"
                    value={roleTitleInput}
                    onChange={e => setRoleTitleInput(e.target.value)}
                    placeholder="e.g. Stores & Material Inward Incharge"
                    className="w-full h-10 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                    {editingUser ? 'Reset Password (Optional, min 8 chars)' : 'Initial Password (min 8 chars) *'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-[#777b86] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required={!editingUser}
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder={editingUser ? 'Leave blank to keep existing' : 'Min 8 characters'}
                      className="w-full h-10 pl-9 pr-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] focus:bg-white text-xs text-[#17191c] font-mono focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ERP Module Access Selector */}
              <div className="space-y-2.5 pt-2 border-t border-[#ececec]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                      ERP Module Access Permissions *
                    </div>
                    <p className="text-[11px] text-[#777b86]">
                      Select exactly which ERP modules will appear in this user&apos;s workspace.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAllowedModulesInput([...ALL_STANDARD_MODULE_IDS])}
                      className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[10px] font-semibold text-[#17191c] cursor-pointer"
                    >
                      Select All Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllowedModulesInput([])}
                      className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[10px] font-semibold text-[#777b86] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ERP_MODULE_CATALOG.filter(m => !m.superAdminOnly || roleInput === 'SUPER_ADMIN').map(mod => {
                    const checked =
                      roleInput === 'SUPER_ADMIN' || allowedModulesInput.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleModulePermission(mod.id)}
                        className={`p-3 rounded-[16px] border text-left transition flex items-start gap-2.5 cursor-pointer ${
                          checked
                            ? 'bg-[#faf7ed] border-[#c09748] ring-1 ring-[#c09748]/25'
                            : 'bg-[#fafafb] border-[#ececec] hover:border-[#dcdfe4]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                            checked
                              ? 'bg-[#c09748] border-[#c09748] text-[#17191c]'
                              : 'bg-white border-[#dcdfe4]'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#17191c]">{mod.label}</div>
                          <div className="text-[10px] text-[#777b86] leading-snug mt-0.5">{mod.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Account Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                <div>
                  <div className="text-xs font-semibold text-[#17191c]">Account Status</div>
                  <div className="text-[11px] text-[#777b86]">
                    Suspended accounts are immediately blocked from login and database access.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActiveInput(prev => !prev)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition ${
                    isActiveInput
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {isActiveInput ? 'Active' : 'Suspended'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] disabled:opacity-60 text-[#17191c] text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? 'Save Account Changes' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
