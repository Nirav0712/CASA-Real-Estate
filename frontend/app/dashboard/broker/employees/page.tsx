'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  Phone,
  Briefcase,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Key,
} from 'lucide-react';
import {
  getBrokerEmployees,
  createBrokerEmployee,
  updateBrokerEmployee,
  toggleBrokerEmployeeStatus,
} from '@/services/agent-service';
import { BrokerEmployee, BrokerEmployeesResponse } from '@/types';

// The 4 standardized permission categories
const PERMISSION_GROUPS = [
  {
    category: 'Property Management',
    description: 'Control property inventory, drafts, updates, and moderation submissions.',
    permissions: [
      { key: 'property:view', label: 'View Properties', desc: 'Browse and inspect brokerage listings' },
      { key: 'property:create', label: 'Add Properties', desc: 'Draft new property listings' },
      { key: 'property:edit', label: 'Edit Properties', desc: 'Modify pricing, details, and media' },
      { key: 'property:publish', label: 'Submit for Approval', desc: 'Send properties for moderation review' },
      { key: 'property:delete', label: 'Delete/Archive Properties', desc: 'Remove or archive listings' },
    ],
  },
  {
    category: 'Project Management',
    description: 'Oversee multi-unit towers, builder projects, and plotted development.',
    permissions: [
      { key: 'project:view', label: 'View Projects', desc: 'Access project portfolios' },
      { key: 'project:create', label: 'Add Projects', desc: 'Create new builder developments' },
      { key: 'project:edit', label: 'Edit Projects', desc: 'Update project configurations and towers' },
      { key: 'project:manage', label: 'Manage Details & Units', desc: 'Assign unit inventories and pricing' },
    ],
  },
  {
    category: 'Video Reels',
    description: 'Create and manage 9:16 vertical video walkthroughs.',
    permissions: [
      { key: 'reel:view', label: 'View Reels', desc: 'Watch submitted property video reels' },
      { key: 'reel:create', label: 'Upload Reels', desc: 'Upload 9:16 vertical walkthrough videos' },
      { key: 'reel:edit', label: 'Edit Reels', desc: 'Change titles, tags, and thumbnails' },
      { key: 'reel:delete', label: 'Delete Reels', desc: 'Remove video reels from marketplace' },
    ],
  },
  {
    category: 'Clients, Leads & CRM',
    description: 'Lead engagement, enquiry follow-ups, and customer relationship management.',
    permissions: [
      { key: 'lead:view', label: 'View Clients & Leads', desc: 'Read prospective buyer contacts' },
      { key: 'lead:create', label: 'Add Clients & Leads', desc: 'Log walk-in and external leads' },
      { key: 'lead:edit', label: 'Edit Client & Lead Details', desc: 'Update budgets, notes, and stages' },
      { key: 'enquiry:manage', label: 'Manage Enquiries', desc: 'Process direct property inquiries' },
      { key: 'crm:followup', label: 'Manage Follow-ups & Reminders', desc: 'Schedule site visits and tasks' },
      { key: 'crm:view', label: 'Access CRM', desc: 'Open pipeline kanban and CRM dashboard' },
      { key: 'lead:assign', label: 'Assign Leads', desc: 'Delegate leads to team colleagues' },
    ],
  },
];

export default function BrokerEmployeesPage() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const isBrokerVerified = Boolean(
    user?.isVerifiedAgent ||
    user?.kycStatus === 'APPROVED' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN'
  );

  const [employees, setEmployees] = React.useState<BrokerEmployee[]>([]);
  const [summary, setSummary] = React.useState({ total: 0, active: 0, inactive: 0, quotaLimit: 5 });
  const [loading, setLoading] = React.useState(true);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<BrokerEmployee | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Form Fields
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [designation, setDesignation] = React.useState('Associate Broker');
  const [password, setPassword] = React.useState('');
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([
    'property:view',
    'property:create',
    'lead:view',
    'crm:view',
  ]);

  const loadData = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getBrokerEmployees();
      setEmployees(res.employees || []);
      setSummary(res.summary || { total: 0, active: 0, inactive: 0, quotaLimit: 5 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch team employees';
      // If unverified, the backend will return a clear message
      if (msg.includes('verified')) {
        toast.info('Verification Required', msg);
      } else {
        toast.error('Data Error', msg);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    if (!isBrokerVerified) {
      toast.error(
        'Broker Verification Required',
        'Only verified Brokers can create employee accounts. Please submit your RERA/KYC verification.',
      );
      return;
    }
    setEditingEmployee(null);
    setFullName('');
    setEmail('');
    setMobile('');
    setDesignation('Associate Broker');
    setPassword('');
    setSelectedPermissions(['property:view', 'property:create', 'lead:view', 'crm:view']);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: BrokerEmployee) => {
    setEditingEmployee(emp);
    setFullName(emp.name);
    setEmail(emp.email || '');
    setMobile(emp.mobile || '');
    setDesignation(emp.designation || 'Associate Broker');
    setPassword('');
    setSelectedPermissions(emp.permissions || []);
    setIsModalOpen(true);
  };

  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim()) {
      toast.error('Validation Error', 'Full name and mobile number are required.');
      return;
    }

    if (!editingEmployee && (!password || password.length < 8)) {
      toast.error('Validation Error', 'A secure initial password (minimum 8 characters) is required.');
      return;
    }

    if (editingEmployee && password && password.length < 8) {
      toast.error('Validation Error', 'New password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEmployee) {
        await updateBrokerEmployee(editingEmployee.id || editingEmployee._id!, {
          name: fullName.trim(),
          email: email.trim() || undefined,
          mobile: mobile.trim(),
          designation: designation.trim(),
          password: password ? password : undefined,
          permissions: selectedPermissions,
        });
        toast.success('Employee Updated', `Account for ${fullName} updated successfully.`);
      } else {
        await createBrokerEmployee({
          name: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          designation: designation.trim(),
          password,
          permissions: selectedPermissions,
        });
        toast.success('Employee Added', `Employee account for ${fullName} created successfully.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error('Submission Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp: BrokerEmployee) => {
    try {
      const res = await toggleBrokerEmployeeStatus(emp.id || emp._id!);
      toast.info(
        'Status Changed',
        `${emp.name}'s account is now ${res.employee?.status || 'updated'}.`,
      );
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not change status';
      toast.error('Action Failed', msg);
    }
  };

  return (
    <RoleGuard
      allowedRoles={['BROKER', 'ADMIN', 'SUPER_ADMIN']}
      dashboardName="Broker Employee Management"
      loginPrompt="Please sign in with your Broker credentials to manage employee accounts."
    >
      <div className="min-h-screen bg-casa-canvas py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 text-start">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-casa-text-muted">
          <Link href="/dashboard/broker" className="hover:text-casa-brand flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Broker Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-casa-text-primary font-semibold">Employee Management</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-casa-text-primary tracking-tight">
                Employee Management
              </h1>
            </div>
            <p className="text-xs text-casa-text-secondary mt-1 max-w-2xl">
              Create and manage separate employee accounts, assign granular permissions across properties, reels, projects, and CRM leads with strict tenant data isolation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="text-xs border-casa-border-light hover:bg-casa-subtle"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openAddModal}
              disabled={!isBrokerVerified}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Unverified Broker Alert */}
        {!isBrokerVerified && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold">Broker Verification Required</strong>
              <p>
                Only verified Brokers with an approved RERA or business license can create and manage employee accounts.
                Please complete your verification in the{' '}
                <Link href="/dashboard/agent/verification" className="underline font-bold text-amber-700 dark:text-amber-300">
                  Verification Center
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border border-casa-border-light bg-casa-surface shadow-subtle">
            <div className="flex items-center justify-between text-xs text-casa-text-muted">
              <span>Total Employees</span>
              <Users className="w-4 h-4 text-casa-brand" />
            </div>
            <h3 className="text-2xl font-bold text-casa-text-primary mt-1">{summary.total}</h3>
            <span className="text-[10px] text-casa-text-muted">Registered in brokerage</span>
          </Card>

          <Card className="p-4 border border-casa-border-light bg-casa-surface shadow-subtle">
            <div className="flex items-center justify-between text-xs text-emerald-600">
              <span>Active Accounts</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{summary.active}</h3>
            <span className="text-[10px] text-casa-text-muted">Authorized to log in</span>
          </Card>

          <Card className="p-4 border border-casa-border-light bg-casa-surface shadow-subtle">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Inactive Accounts</span>
              <UserX className="w-4 h-4 text-zinc-500" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-600 dark:text-zinc-400 mt-1">{summary.inactive}</h3>
            <span className="text-[10px] text-casa-text-muted">Access suspended</span>
          </Card>

          <Card className="p-4 border border-casa-border-light bg-casa-surface shadow-subtle">
            <div className="flex items-center justify-between text-xs text-amber-600">
              <span>Plan Seat Limit</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {summary.total} / {summary.quotaLimit || '∞'}
            </h3>
            <span className="text-[10px] text-casa-text-muted">Seats allowed in plan</span>
          </Card>
        </div>

        {/* Employee List */}
        {loading ? (
          <div className="p-16 text-center text-xs text-casa-text-muted flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-casa-brand" />
            <span>Loading brokerage team members...</span>
          </div>
        ) : employees.length === 0 ? (
          <Card className="p-12 text-center border-casa-border-light bg-casa-surface space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-casa-text-primary">No Employee Accounts Yet</h3>
            <p className="text-xs text-casa-text-secondary max-w-sm mx-auto">
              Add your first team member to delegate property listings, customer leads, and 9:16 reels while maintaining full administrative oversight.
            </p>
            {isBrokerVerified && (
              <Button
                variant="primary"
                size="sm"
                onClick={openAddModal}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Employee
              </Button>
            )}
          </Card>
        ) : (
          <Card className="border border-casa-border-light bg-casa-surface overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-casa-canvas text-casa-text-muted uppercase text-[10px] tracking-wider border-b border-casa-border-light">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Employee</th>
                    <th className="py-3.5 px-4 font-semibold">Designation</th>
                    <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                    <th className="py-3.5 px-4 font-semibold">Assigned Permissions</th>
                    <th className="py-3.5 px-4 font-semibold">Account Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-casa-border-light">
                  {employees.map((emp) => {
                    const isActive = emp.status === 'ACTIVE';
                    return (
                      <tr key={emp.id || emp._id} className="hover:bg-casa-subtle/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-casa-brand-subtle text-casa-brand font-bold flex items-center justify-center text-xs">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-casa-text-primary">{emp.name}</p>
                              <span className="text-[10px] text-casa-text-muted">
                                Added {new Date(emp.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-casa-text-secondary">
                          <span className="px-2 py-0.5 rounded bg-casa-canvas border border-casa-border-light text-[11px]">
                            {emp.designation || 'Associate'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-casa-text-primary">
                            <Phone className="w-3 h-3 text-casa-text-muted" />
                            <span>{emp.normalizedMobile || emp.mobile}</span>
                          </div>
                          {emp.email && (
                            <div className="flex items-center gap-1.5 text-casa-text-muted text-[11px]">
                              <Mail className="w-3 h-3 text-casa-text-muted" />
                              <span className="truncate max-w-[150px]">{emp.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1 max-w-xs">
                            {emp.permissions && emp.permissions.length > 0 ? (
                              emp.permissions.slice(0, 3).map((p) => (
                                <span
                                  key={p}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-casa-canvas border border-casa-border-light text-casa-text-secondary font-mono"
                                >
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-casa-text-muted">No permissions</span>
                            )}
                            {emp.permissions && emp.permissions.length > 3 && (
                              <span className="text-[9px] text-casa-text-muted font-bold">
                                +{emp.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                            {emp.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(emp)}
                              className="text-xs h-7 px-2 border-casa-border-light hover:bg-casa-subtle"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(emp)}
                              className={`text-xs h-7 px-2 border-casa-border-light ${
                                isActive
                                  ? 'hover:bg-rose-50 hover:text-rose-600'
                                  : 'hover:bg-emerald-50 hover:text-emerald-600'
                              }`}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Add / Edit Employee Modal */}
        {isModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsModalOpen(false)}
            title={editingEmployee ? `Edit Employee: ${editingEmployee.name}` : 'Add New Broker Employee'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-casa-text-primary">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-casa-text-primary">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Property Advisor"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-casa-text-primary">
                    Mobile Number (Login Identifier) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-casa-text-primary">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@brokerage.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
                  />
                </div>
              </div>

              {/* Password / Login Setup */}
              <div className="p-3.5 bg-casa-canvas rounded-2xl border border-casa-border-light space-y-1 text-xs">
                <label className="font-semibold text-casa-text-primary flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-casa-brand" />
                  <span>{editingEmployee ? 'Update Login Password (Optional)' : 'Account Password'}</span>
                  {!editingEmployee && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingEmployee}
                  placeholder={editingEmployee ? 'Leave blank to preserve existing password' : 'Enter a secure initial password (minimum 8 characters)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
                />
                <p className="text-[10px] text-casa-text-muted">
                  Employee logs in with their mobile number and this password. They cannot register as a Broker.
                </p>
              </div>

              {/* Permissions Categorization */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-casa-text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-casa-brand" />
                    <span>Role & Scoped Permissions</span>
                  </h4>
                  <span className="text-[10px] text-casa-text-muted">
                    {selectedPermissions.length} selected
                  </span>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map((group) => (
                    <div
                      key={group.category}
                      className="p-3 bg-casa-canvas border border-casa-border-light rounded-2xl space-y-2 text-xs"
                    >
                      <div>
                        <strong className="text-casa-text-primary block font-bold">{group.category}</strong>
                        <span className="text-[10px] text-casa-text-muted">{group.description}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {group.permissions.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-casa-brand-subtle/30 border-casa-brand ring-1 ring-casa-brand/50'
                                  : 'bg-casa-surface border-casa-border-light hover:bg-casa-subtle'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.key)}
                                className="mt-0.5 accent-amber-600 rounded"
                              />
                              <div>
                                <span className="font-semibold text-casa-text-primary block text-[11px]">
                                  {perm.label}
                                </span>
                                <span className="text-[9px] text-casa-text-muted">{perm.desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-casa-border-light">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submitting
                    ? 'Saving...'
                    : editingEmployee
                    ? 'Update Employee'
                    : 'Create Employee Account'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </RoleGuard>
  );
}
