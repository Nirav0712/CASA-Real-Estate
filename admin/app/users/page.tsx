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
} from 'lucide-react';
import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  updateAdminUserRole,
} from '@/services/admin-service';
import { UserRecord, UserDetailRecord, UserRole, AccountStatus } from '@/types';

export default function UsersPage() {
  const toast = useToast();

  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [verifiedFilter, setVerifiedFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalUsers, setTotalUsers] = React.useState(0);

  // User Detail Drawer State
  const [selectedUser, setSelectedUser] = React.useState<UserDetailRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // Status Action Modal State
  const [statusModalUser, setStatusModalUser] = React.useState<UserRecord | null>(null);
  const [newStatus, setNewStatus] = React.useState<AccountStatus>('ACTIVE');
  const [statusReason, setStatusReason] = React.useState('');
  const [submittingStatus, setSubmittingStatus] = React.useState(false);

  // Role Action Modal State
  const [roleModalUser, setRoleModalUser] = React.useState<UserRecord | null>(null);
  const [newRole, setNewRole] = React.useState<UserRole>('AGENT');
  const [roleReason, setRoleReason] = React.useState('');
  const [submittingRole, setSubmittingRole] = React.useState(false);

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
    setNewRole(user.role);
    setRoleReason('');
  };

  const handleConfirmRole = async () => {
    if (!roleModalUser) return;
    try {
      setSubmittingRole(true);
      await updateAdminUserRole(roleModalUser.id, newRole, roleReason);
      toast.success(
        'Role Updated',
        `User ${roleModalUser.name} role changed to ${newRole.replace('_', ' ')}.`,
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
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-casa-canvas/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-casa-text-primary flex items-center gap-1.5">
                        {u.name || 'Unnamed User'}
                        {u.role === 'SUPER_ADMIN' && (
                          <Shield className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                        )}
                      </div>
                      <div className="text-[11px] text-casa-text-muted flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {u.normalizedMobile || u.mobile}
                      </div>
                      {u.email && (
                        <div className="text-[10px] text-casa-text-muted font-mono">{u.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-casa-brand-subtle text-casa-brand uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
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
                      </div>
                    </td>
                  </tr>
                ))}
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-casa-brand-subtle text-casa-brand uppercase">
                      {selectedUser.role.replace('_', ' ')}
                    </span>
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
                <div className="pt-4 border-t border-casa-border-light flex gap-2">
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
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Action Modal */}
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
                <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                  Select New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
                >
                  <option value="PURCHASER">Purchaser (Buyer)</option>
                  <option value="PROPERTY_OWNER">Property Owner</option>
                  <option value="AGENT">Agent (Real Estate Broker)</option>
                  <option value="VERIFIED_AGENT">Verified Agent (CASA Badge)</option>
                  <option value="MODERATOR">Moderator (Listing Reviewer)</option>
                  <option value="ADMIN">Admin (Governance Operator)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                  Reason for Governance Audit Log
                </label>
                <textarea
                  placeholder="e.g. Agent onboarding, operator permission grant..."
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
    </div>
  );
}
