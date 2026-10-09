'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import {
  Users,
  Search,
  Phone,
  CheckCircle,
  Shield,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  AlertTriangle,
  X,
  Clock,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  updateAdminUserRole,
  getAdminAssignableRoles,
  deleteAdminUser,
  bulkDeleteAdminUsers,
  bulkUpdateAdminUserStatus,
} from '@/services/admin-service';
import { UserRecord, UserDetailRecord, AccountStatus, RoleRecord } from '@/types';

export default function UsersPage() {
  const toast = useToast();

  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dynamic Roles
  const [roles, setRoles] = React.useState<RoleRecord[]>([]);
  const [loadingRoles, setLoadingRoles] = React.useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [verifiedFilter, setVerifiedFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalUsers, setTotalUsers] = React.useState(0);

  // Bulk Selection State
  const [selectedUserIds, setSelectedUserIds] = React.useState<Set<string>>(new Set());

  // User Detail Drawer State
  const [selectedUser, setSelectedUser] = React.useState<UserDetailRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // Single Status Action Modal State
  const [statusModalUser, setStatusModalUser] = React.useState<UserRecord | null>(null);
  const [newStatus, setNewStatus] = React.useState<AccountStatus>('ACTIVE');
  const [statusReason, setStatusReason] = React.useState('');
  const [submittingStatus, setSubmittingStatus] = React.useState(false);

  // Single Role Action Modal State
  const [roleModalUser, setRoleModalUser] = React.useState<UserRecord | null>(null);
  const [newRole, setNewRole] = React.useState<string>('AGENT');
  const [roleReason, setRoleReason] = React.useState('');
  const [submittingRole, setSubmittingRole] = React.useState(false);

  // Single Delete Modal State
  const [deleteModalUser, setDeleteModalUser] = React.useState<UserRecord | null>(null);
  const [deleteReason, setDeleteReason] = React.useState('');
  const [submittingDelete, setSubmittingDelete] = React.useState(false);

  // Bulk Delete Modal State
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = React.useState(false);
  const [bulkDeleteReason, setBulkDeleteReason] = React.useState('');
  const [submittingBulkDelete, setSubmittingBulkDelete] = React.useState(false);

  // Bulk Status Modal State
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = React.useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = React.useState<AccountStatus>('SUSPENDED');
  const [bulkStatusReason, setBulkStatusReason] = React.useState('');
  const [submittingBulkStatus, setSubmittingBulkStatus] = React.useState(false);

  // Load assignable roles from DB
  const loadRoles = React.useCallback(async () => {
    try {
      setLoadingRoles(true);
      const data = await getAdminAssignableRoles();
      setRoles(data || []);
    } catch (err: unknown) {
      console.warn('Could not load assignable roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  React.useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminUsers({
        page,
        limit: 20,
        q: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        verified: verifiedFilter,
      });
      setUsers(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalUsers(res.pagination?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load users';
      setError(msg);
      toast.error('Load Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter, verifiedFilter, toast]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Selection handlers
  const isAllPageSelected =
    users.length > 0 && users.every((u) => selectedUserIds.has(u.id));
  const isSomePageSelected =
    users.some((u) => selectedUserIds.has(u.id)) && !isAllPageSelected;

  const toggleSelectAllPage = () => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        users.forEach((u) => next.delete(u.id));
      } else {
        users.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleOpenDetail = async (user: UserRecord) => {
    try {
      setLoadingDetail(true);
      setSelectedUser(null);
      const detail = await getAdminUserById(user.id);
      setSelectedUser(detail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not load user details';
      toast.error('Detail Error', msg);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenStatusModal = (user: UserRecord) => {
    setStatusModalUser(user);
    setNewStatus(user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
    setStatusReason('');
  };

  const handleConfirmStatus = async () => {
    if (!statusModalUser) return;
    try {
      setSubmittingStatus(true);
      await updateAdminUserStatus(statusModalUser.id, newStatus, statusReason);
      toast.success(
        'Status Updated',
        `User ${statusModalUser.name} status changed to ${newStatus}.`,
      );
      setStatusModalUser(null);
      loadUsers();
      if (selectedUser?.id === statusModalUser.id) {
        handleOpenDetail(statusModalUser);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation denied';
      toast.error('Status Update Failed', msg);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleOpenRoleModal = (user: UserRecord) => {
    setRoleModalUser(user);
    if (user.customRoleId) {
      setNewRole(user.customRoleId);
    } else {
      const matchingSysRole = roles.find((r) => {
        if (!r.isSystemRole) return false;
        if (user.role === 'SUPER_ADMIN' && r.platformRole === 'SUPER_ADMIN') return true;
        if (user.role === 'ADMIN' && r.platformRole === 'ADMIN') return true;
        if (user.role === 'MODERATOR' && r.platformRole === 'MODERATOR') return true;
        if (user.role === 'VERIFIED_AGENT' && (r.slug === 'verified-agent' || r.slug === 'agent')) return true;
        if (user.role === 'AGENT' && (r.accountType === 'AGENT' || r.slug === 'agent')) return true;
        if (user.role === 'PROPERTY_OWNER' && (r.accountType === 'PROPERTY_OWNER' || r.slug === 'property-owner')) return true;
        if (
          (user.role === 'PURCHASER' || user.role === 'BUYER') &&
          (r.accountType === 'BUYER' || r.slug === 'buyer')
        )
          return true;
        return false;
      });
      setNewRole(matchingSysRole ? (matchingSysRole.id || matchingSysRole._id || matchingSysRole.slug) : user.role);
    }
    setRoleReason('');
  };

  const handleConfirmRole = async () => {
    if (!roleModalUser) return;
    try {
      setSubmittingRole(true);
      const res = await updateAdminUserRole(roleModalUser.id, newRole, roleReason);
      const assignedName =
        roles.find((r) => (r.id || r._id) === newRole || r.slug === newRole)?.name ||
        res.user?.roleName ||
        newRole.replace('_', ' ');
      toast.success(
        'Role Updated',
        `User ${roleModalUser.name} role changed to ${assignedName}.`,
      );
      setRoleModalUser(null);
      loadUsers();
      if (selectedUser?.id === roleModalUser.id) {
        handleOpenDetail(roleModalUser);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation denied';
      toast.error('Role Update Failed', msg);
    } finally {
      setSubmittingRole(false);
    }
  };

  // Single User Delete Handlers
  const handleOpenDeleteModal = (user: UserRecord) => {
    setDeleteModalUser(user);
    setDeleteReason('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    try {
      setSubmittingDelete(true);
      await deleteAdminUser(deleteModalUser.id, deleteReason);
      toast.success(
        'User Deleted',
        `User ${deleteModalUser.name || deleteModalUser.normalizedMobile} has been permanently deleted.`,
      );
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteModalUser.id);
        return next;
      });
      if (selectedUser?.id === deleteModalUser.id) {
        setSelectedUser(null);
      }
      setDeleteModalUser(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete operation failed';
      toast.error('Delete Failed', msg);
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Bulk Delete Handlers
  const handleOpenBulkDeleteModal = () => {
    if (selectedUserIds.size === 0) return;
    setBulkDeleteReason('');
    setBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedUserIds.size === 0) return;
    try {
      setSubmittingBulkDelete(true);
      const userIdsArray = Array.from(selectedUserIds);
      const res = await bulkDeleteAdminUsers(userIdsArray, bulkDeleteReason);
      toast.success(
        'Bulk Delete Completed',
        res.message || `${res.deletedCount || userIdsArray.length} users successfully deleted.`,
      );
      clearSelection();
      setBulkDeleteModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk deletion failed';
      toast.error('Bulk Delete Failed', msg);
    } finally {
      setSubmittingBulkDelete(false);
    }
  };

  // Bulk Status Update Handlers
  const handleOpenBulkStatusModal = (status: AccountStatus) => {
    if (selectedUserIds.size === 0) return;
    setBulkTargetStatus(status);
    setBulkStatusReason('');
    setBulkStatusModalOpen(true);
  };

  const handleConfirmBulkStatus = async () => {
    if (selectedUserIds.size === 0) return;
    try {
      setSubmittingBulkStatus(true);
      const userIdsArray = Array.from(selectedUserIds);
      const res = await bulkUpdateAdminUserStatus(userIdsArray, bulkTargetStatus, bulkStatusReason);
      toast.success(
        'Bulk Status Updated',
        res.message || `${userIdsArray.length} users updated to ${bulkTargetStatus}.`,
      );
      clearSelection();
      setBulkStatusModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk status update failed';
      toast.error('Bulk Update Failed', msg);
    } finally {
      setSubmittingBulkStatus(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              All Users & RBAC Accounts
            </h1>
            <span className="text-xs px-2.5 py-1 bg-casa-subtle rounded-full font-bold text-casa-text-secondary border border-casa-border-light">
              {totalUsers} Total
            </span>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Registered buyers, verified brokers, property owners, and administrative operators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
            <input
              type="text"
              placeholder="Search by name, mobile, email, agency, RERA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary placeholder:text-casa-text-muted"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Role"
            className="py-2 px-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MODERATOR">Moderator</option>
            <option value="VERIFIED_AGENT">Verified Agent</option>
            <option value="AGENT">Agent</option>
            <option value="PROPERTY_OWNER">Property Owner</option>
            <option value="PURCHASER">Purchaser</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Status"
            className="py-2 px-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>

          {/* Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Verification Status"
            className="py-2 px-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
          >
            <option value="ALL">All Verification</option>
            <option value="true">Verified Agent</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </Card>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedUserIds.size > 0 && (
        <div className="sticky top-4 z-40 bg-casa-surface dark:bg-slate-900 border-2 border-casa-brand/40 shadow-2xl rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-casa-brand text-white font-bold text-xs">
              {selectedUserIds.size}
            </div>
            <div>
              <span className="text-xs md:text-sm font-bold text-casa-text-primary">
                {selectedUserIds.size} User{selectedUserIds.size > 1 ? 's' : ''} Selected
              </span>
              <p className="text-[11px] text-casa-text-muted hidden sm:block">
                Choose an administrative action to apply in bulk
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenBulkStatusModal('SUSPENDED')}
              className="text-xs h-8 px-3 text-amber-700 dark:text-amber-300 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-1.5 font-semibold"
            >
              <UserX className="w-3.5 h-3.5 text-amber-600" />
              Suspend ({selectedUserIds.size})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenBulkStatusModal('ACTIVE')}
              className="text-xs h-8 px-3 text-emerald-700 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1.5 font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Activate ({selectedUserIds.size})
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenBulkDeleteModal}
              className="text-xs h-8 px-3 bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 font-semibold shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedUserIds.size})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="text-xs h-8 px-2.5 text-casa-text-muted hover:text-casa-text-primary"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <Card className="bg-casa-surface border border-casa-border-light shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-casa-text-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-casa-brand" />
            <p className="text-xs">Loading live MongoDB user records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 space-y-2">
            <AlertTriangle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={loadUsers} className="text-xs">
              Retry
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-casa-text-muted space-y-2">
            <Users className="w-8 h-8 mx-auto text-casa-text-muted/50" />
            <p className="text-sm font-semibold text-casa-text-primary">No users found</p>
            <p className="text-xs">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-casa-text-secondary">
              <thead className="bg-casa-subtle/50 text-[11px] uppercase font-bold text-casa-text-muted border-b border-casa-border-light">
                <tr>
                  <th className="w-10 px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllPage}
                      className="p-1 text-casa-text-secondary hover:text-casa-brand transition-colors inline-flex items-center justify-center"
                      title={isAllPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                    >
                      {isAllPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-casa-brand" />
                      ) : isSomePageSelected ? (
                        <MinusSquare className="w-4 h-4 text-casa-brand" />
                      ) : (
                        <Square className="w-4 h-4 text-casa-text-muted" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">User & Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Properties</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light">
                {users.map((u) => {
                  const isSelected = selectedUserIds.has(u.id);
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-casa-brand-subtle/30 dark:bg-casa-brand/10'
                          : 'hover:bg-casa-canvas/50'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(u.id)}
                          aria-label={`Select user ${u.name || u.mobile}`}
                          className="w-4 h-4 text-casa-brand rounded border-casa-border-light focus:ring-casa-brand/30 cursor-pointer accent-casa-brand"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-casa-text-primary flex items-center gap-1.5">
                          {u.name || 'Unnamed User'}
                          {u.role === 'SUPER_ADMIN' && (
                            <Shield className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              u.customRole
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-casa-brand-subtle text-casa-brand'
                            }`}
                          >
                            {u.customRole?.name || u.roleName || u.role.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-casa-text-muted flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {u.normalizedMobile || u.mobile}
                          </span>
                        </div>
                        {u.email && (
                          <div className="text-[10px] text-casa-text-muted font-mono mt-0.5">{u.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-0.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              u.customRole
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-casa-brand-subtle text-casa-brand'
                            }`}
                          >
                            {u.customRole?.name || u.roleName || u.role.replace('_', ' ')}
                          </span>
                          {u.customRole && (
                            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold">
                              Custom Dynamic
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.isVerifiedAgent ? (
                          <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> CASA Verified
                          </span>
                        ) : u.role === 'AGENT' ? (
                          <span className="text-amber-600 text-[11px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending Badge
                          </span>
                        ) : (
                          <span className="text-casa-text-muted text-[11px]">N/A</span>
                        )}
                        {u.agencyName && (
                          <div className="text-[10px] text-casa-text-muted flex items-center gap-1 mt-0.5">
                            <Building2 className="w-2.5 h-2.5" /> {u.agencyName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-casa-text-primary">
                          {u.propertyCount ?? 0} Total
                        </div>
                        <div className="text-[10px] text-emerald-600">
                          {u.publishedCount ?? 0} Published
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : u.status === 'SUSPENDED'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-casa-text-muted text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(u)}
                            title="View Details"
                            className="text-xs p-1.5 h-7"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRoleModal(u)}
                            className="text-xs h-7 px-2"
                          >
                            Role
                          </Button>
                          <Button
                            variant={u.status === 'ACTIVE' ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => handleOpenStatusModal(u)}
                            className={`text-xs h-7 px-2 ${
                              u.status === 'ACTIVE' ? 'hover:bg-red-50 hover:text-red-600' : ''
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(u)}
                            title="Delete User"
                            className="text-xs p-1.5 h-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-casa-border-light flex items-center justify-between text-xs text-casa-text-muted">
          <div>
            Showing Page <strong className="text-casa-text-primary">{page}</strong> of{' '}
            <strong className="text-casa-text-primary">{totalPages}</strong> ({totalUsers} users)
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* User Detail Drawer / Modal */}
      {(selectedUser || loadingDetail) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-casa-surface h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-casa-border-light animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-casa-border-light">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-casa-brand-subtle text-casa-brand rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-casa-text-primary">User Governance Profile</h2>
                  <p className="text-xs text-casa-text-muted">Live MongoDB Database Record</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {loadingDetail ? (
              <div className="py-20 text-center text-casa-text-muted flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-casa-brand" />
                <p className="text-xs">Fetching profile & properties...</p>
              </div>
            ) : selectedUser && (
              <div className="space-y-6 text-xs">
                {/* Profile Card */}
                <div className="p-4 bg-casa-canvas rounded-xl border border-casa-border-light space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-casa-text-primary flex items-center gap-1.5">
                        {selectedUser.name}
                        {selectedUser.isVerifiedAgent && (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-casa-text-muted">{selectedUser.normalizedMobile}</div>
                      {selectedUser.email && (
                        <div className="text-casa-text-muted font-mono">{selectedUser.email}</div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-0.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          selectedUser.customRole
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-casa-brand-subtle text-casa-brand'
                        }`}
                      >
                        {selectedUser.customRole?.name || selectedUser.roleName || selectedUser.role.replace('_', ' ')}
                      </span>
                      {selectedUser.customRole && (
                        <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                          Dynamic Custom Role
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-casa-border-light text-[11px]">
                    <div>
                      Status:{' '}
                      <strong
                        className={
                          selectedUser.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'
                        }
                      >
                        {selectedUser.status}
                      </strong>
                    </div>
                    <div>
                      Verification:{' '}
                      <strong>{selectedUser.isVerifiedAgent ? 'Verified' : 'Regular'}</strong>
                    </div>
                    {selectedUser.agencyName && (
                      <div className="col-span-2">
                        Agency: <strong>{selectedUser.agencyName}</strong>
                      </div>
                    )}
                    {selectedUser.reraNumber && (
                      <div className="col-span-2 font-mono">
                        RERA: <strong>{selectedUser.reraNumber}</strong>
                      </div>
                    )}
                    <div>
                      Joined:{' '}
                      <strong>
                        {selectedUser.createdAt
                          ? new Date(selectedUser.createdAt).toLocaleDateString()
                          : '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Property Summary Breakdown */}
                <div className="space-y-2">
                  <h3 className="font-bold text-casa-text-primary text-xs uppercase tracking-wider">
                    Property Portfolio Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light text-center">
                      <div className="text-lg font-bold text-casa-text-primary">
                        {selectedUser.propertySummary?.total ?? 0}
                      </div>
                      <div className="text-[10px] text-casa-text-muted">Total Properties</div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-lg font-bold text-emerald-600">
                        {selectedUser.propertySummary?.published ?? 0}
                      </div>
                      <div className="text-[10px] text-emerald-600">Published</div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                      <div className="text-lg font-bold text-amber-600">
                        {selectedUser.propertySummary?.pending ?? 0}
                      </div>
                      <div className="text-[10px] text-amber-600">Pending Review</div>
                    </div>
                  </div>
                </div>

                {/* Properties List */}
                <div className="space-y-2">
                  <h3 className="font-bold text-casa-text-primary text-xs uppercase tracking-wider">
                    Associated Listings ({selectedUser.properties?.length || 0})
                  </h3>
                  {selectedUser.properties?.length === 0 ? (
                    <div className="p-4 bg-casa-canvas rounded-xl border border-casa-border-light text-center text-casa-text-muted">
                      No listings created by this user yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedUser.properties?.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-casa-canvas rounded-xl border border-casa-border-light flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-casa-text-primary line-clamp-1">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-casa-text-muted">
                              ₹{p.price ? (p.price / 100000).toFixed(1) + ' Lakh' : 'N/A'} • {p.category}
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              p.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-600'
                                : p.status === 'PENDING_REVIEW'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-casa-subtle text-casa-text-muted'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-casa-border-light flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => {
                      handleOpenRoleModal(selectedUser);
                    }}
                  >
                    Change Role
                  </Button>
                  <Button
                    variant={selectedUser.status === 'ACTIVE' ? 'outline' : 'primary'}
                    className={`flex-1 text-xs ${
                      selectedUser.status === 'ACTIVE' ? 'hover:bg-red-50 hover:text-red-600' : ''
                    }`}
                    onClick={() => {
                      handleOpenStatusModal(selectedUser);
                    }}
                  >
                    {selectedUser.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/50 flex items-center justify-center gap-1.5"
                    onClick={() => {
                      handleOpenDeleteModal(selectedUser);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete User Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Single Status Action Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-2 text-casa-text-primary">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold">Update Account Status</h3>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Modify account status for <strong>{statusModalUser.name}</strong> (
              {statusModalUser.normalizedMobile}). Suspended or deactivated users will have active
              refresh sessions revoked immediately.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                  Target Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AccountStatus)}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
                >
                  <option value="ACTIVE">ACTIVE — Normal access granted</option>
                  <option value="SUSPENDED">SUSPENDED — Blocked from protected actions</option>
                  <option value="DEACTIVATED">DEACTIVATED — Permanently disabled</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                  Reason for Governance Audit Log
                </label>
                <textarea
                  placeholder="e.g. Terms violation, requested deactivation, duplicate account..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusModalUser(null)}
                disabled={submittingStatus}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmStatus}
                disabled={submittingStatus}
                className="text-xs"
              >
                {submittingStatus ? 'Updating...' : 'Confirm Status Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role Action Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-2 text-casa-text-primary">
              <Shield className="w-5 h-5 text-casa-brand" />
              <h3 className="text-base font-bold">Update User Role</h3>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Update authorization role for <strong>{roleModalUser.name}</strong>. Note that Super
              Admin promotions and self-promotions are strictly restricted by server RBAC.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-casa-text-muted uppercase flex items-center justify-between">
                  <span>Select New Role (Dynamic DB Roles)</span>
                  {loadingRoles && (
                    <span className="text-[10px] text-casa-brand flex items-center gap-1 font-normal">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Loading roles...
                    </span>
                  )}
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30 font-medium"
                >
                  {roles.filter((r) => !r.isSystemRole && r.isActive !== false).length > 0 && (
                    <optgroup label="Active Custom Roles (Dynamic)">
                      {roles
                        .filter((r) => !r.isSystemRole && r.isActive !== false)
                        .map((r) => (
                          <option key={r.id || r._id} value={r.id || r._id}>
                            {r.name} (Custom — {r.accountType || r.platformRole || 'Scoped'})
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {roles.filter((r) => r.isSystemRole && r.isActive !== false).length > 0 ? (
                    <optgroup label="Standard System Roles">
                      {roles
                        .filter((r) => r.isSystemRole && r.isActive !== false)
                        .map((r) => (
                          <option key={r.id || r._id || r.slug} value={r.id || r._id || r.slug}>
                            {r.name} (System — {r.platformRole === 'USER' ? (r.accountType || 'Buyer') : r.platformRole})
                          </option>
                        ))}
                    </optgroup>
                  ) : (
                    <optgroup label="System Roles">
                      <option value="PURCHASER">Purchaser (Buyer)</option>
                      <option value="PROPERTY_OWNER">Property Owner</option>
                      <option value="AGENT">Agent (Real Estate Broker)</option>
                      <option value="VERIFIED_AGENT">Verified Agent (CASA Badge)</option>
                      <option value="MODERATOR">Moderator (Listing Reviewer)</option>
                      <option value="ADMIN">Admin (Governance Operator)</option>
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                  Reason for Governance Audit Log
                </label>
                <textarea
                  placeholder="e.g. Dynamic custom role assignment, agent onboarding, governance permission update..."
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleModalUser(null)}
                disabled={submittingRole}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRole}
                disabled={submittingRole}
                className="text-xs"
              >
                {submittingRole ? 'Updating...' : 'Confirm Role Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single User Delete Confirmation Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="p-2 bg-red-100 dark:bg-red-950/60 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">Delete User Account</h3>
                <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">Permanent Action</p>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl space-y-1.5 text-xs">
              <p className="text-red-900 dark:text-red-200 font-medium">
                Are you sure you want to permanently delete{' '}
                <strong>{deleteModalUser.name || deleteModalUser.normalizedMobile}</strong>?
              </p>
              <p className="text-red-700/80 dark:text-red-300/80 text-[11px]">
                Mobile: <span className="font-mono">{deleteModalUser.normalizedMobile || deleteModalUser.mobile}</span> • Role: {deleteModalUser.role}
              </p>
              <p className="text-red-700/80 dark:text-red-300/80 text-[11px]">
                This will revoke all active login sessions and delete user documents from the system.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                Reason for Audit Log (Optional)
              </label>
              <textarea
                placeholder="e.g. Account removal request, fraudulent activity, duplicate entry..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalUser(null)}
                disabled={submittingDelete}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {submittingDelete ? 'Deleting...' : 'Permanently Delete User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="p-2 bg-red-100 dark:bg-red-950/60 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">Bulk Delete Users</h3>
                <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                  {selectedUserIds.size} User Accounts Selected
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl space-y-1 text-xs text-red-900 dark:text-red-200">
              <p className="font-semibold">
                You are about to permanently delete {selectedUserIds.size} user accounts.
              </p>
              <p className="text-[11px] text-red-700/80 dark:text-red-300/80">
                All associated sessions will be invalidated immediately. This action is irreversible.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                Reason for Audit Log
              </label>
              <textarea
                placeholder="e.g. Bulk cleanup of test / duplicate accounts..."
                value={bulkDeleteReason}
                onChange={(e) => setBulkDeleteReason(e.target.value)}
                rows={2}
                className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={submittingBulkDelete}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmBulkDelete}
                disabled={submittingBulkDelete}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {submittingBulkDelete
                  ? 'Deleting Users...'
                  : `Delete ${selectedUserIds.size} Users`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Confirmation Modal */}
      {bulkStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-casa-text-primary">
              <div
                className={`p-2 rounded-xl ${
                  bulkTargetStatus === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                }`}
              >
                {bulkTargetStatus === 'ACTIVE' ? (
                  <UserCheck className="w-5 h-5" />
                ) : (
                  <UserX className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold">Bulk Update Status</h3>
                <p className="text-[11px] text-casa-text-muted font-medium">
                  {selectedUserIds.size} User Accounts Selected
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                  Target Status
                </label>
                <select
                  value={bulkTargetStatus}
                  onChange={(e) => setBulkTargetStatus(e.target.value as AccountStatus)}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
                >
                  <option value="SUSPENDED">SUSPENDED — Block access to protected actions</option>
                  <option value="ACTIVE">ACTIVE — Normal access granted</option>
                  <option value="DEACTIVATED">DEACTIVATED — Permanently disabled</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                  Reason for Audit Log
                </label>
                <textarea
                  placeholder="e.g. Mass suspension due to policy update..."
                  value={bulkStatusReason}
                  onChange={(e) => setBulkStatusReason(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkStatusModalOpen(false)}
                disabled={submittingBulkStatus}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmBulkStatus}
                disabled={submittingBulkStatus}
                className="text-xs"
              >
                {submittingBulkStatus
                  ? 'Updating...'
                  : `Update ${selectedUserIds.size} Users to ${bulkTargetStatus}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
