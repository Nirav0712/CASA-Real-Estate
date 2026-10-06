'use client';

import * as React from 'react';
import {
  MapPin,
  Building2,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Globe2,
  Navigation,
  Compass,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Power,
  Layers,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Eye,
  ListFilter,
  FolderTree,
} from 'lucide-react';
import { Card } from '@/components/ui/button';
import { LocationRecord, LocationType, CreateLocationInput } from '@/types';
import {
  getAdminLocations,
  getAdminLocationTree,
  createAdminLocation,
  updateAdminLocation,
  activateAdminLocation,
  deactivateAdminLocation,
  deleteAdminLocation,
} from '@/services/location-service';

export default function AdminLocationsPage() {
  const [locations, setLocations] = React.useState<LocationRecord[]>([]);
  const [tree, setTree] = React.useState<LocationRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [viewMode, setViewMode] = React.useState<'tree' | 'table'>('tree');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedType, setSelectedType] = React.useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('ALL');

  // Expanded nodes set for tree
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState<boolean>(false);
  const [editingLocation, setEditingLocation] = React.useState<LocationRecord | null>(null);
  const [deleteConfirmLocation, setDeleteConfirmLocation] = React.useState<LocationRecord | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Form State
  const initialFormState: CreateLocationInput = {
    name: '',
    slug: '',
    type: 'CITY' as LocationType,
    parentId: null,
    countryCode: 'IN',
    stateCode: '',
    districtCode: '',
    cityCode: '',
    pincode: '',
    latitude: undefined,
    longitude: undefined,
    aliases: [],
    localizedNames: { en: '', hi: '', ar: '', ur: '' },
    description: '',
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
  };

  const [formData, setFormData] = React.useState<CreateLocationInput>(initialFormState);
  const [aliasInput, setAliasInput] = React.useState<string>('');

  // Load Data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [listRes, treeRes] = await Promise.all([
        getAdminLocations({
          q: searchQuery || undefined,
          type: selectedType !== 'ALL' ? (selectedType as LocationType) : undefined,
          isActive: selectedStatus !== 'ALL' ? selectedStatus === 'ACTIVE' : undefined,
          limit: 100,
        }),
        getAdminLocationTree(),
      ]);

      if (listRes.error) {
        setActionError(listRes.error);
      } else if (listRes.data) {
        setLocations(listRes.data.items);
      }

      if (treeRes.tree && treeRes.tree.length > 0) {
        setTree(treeRes.tree);
        // Expand root and state nodes by default
        const autoExpanded = new Set<string>();
        treeRes.tree.forEach((country) => {
          autoExpanded.add(country.id || (country as any)._id);
          country.children?.forEach((st) => {
            autoExpanded.add(st.id || (st as any)._id);
          });
        });
        setExpandedNodes(autoExpanded);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedStatus]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle tree node expand/collapse
  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Open Create Modal with optional pre-configured parent
  const handleOpenCreateModal = (parent?: LocationRecord) => {
    setActionError(null);
    setActionSuccess(null);
    let defaultType: LocationType = 'CITY';
    let parentId: string | null = null;

    if (parent) {
      parentId = parent.id || (parent as any)._id;
      if (parent.type === 'COUNTRY') defaultType = 'STATE';
      else if (parent.type === 'STATE') defaultType = 'DISTRICT';
      else if (parent.type === 'DISTRICT') defaultType = 'CITY';
      else if (parent.type === 'CITY') defaultType = 'LOCALITY';
      else if (parent.type === 'LOCALITY') defaultType = 'SUB_LOCALITY';
    }

    setFormData({
      ...initialFormState,
      type: defaultType,
      parentId,
      countryCode: parent?.countryCode || 'IN',
      stateCode: parent?.stateCode || '',
      districtCode: parent?.districtCode || '',
    });
    setAliasInput('');
    setEditingLocation(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (loc: LocationRecord) => {
    setActionError(null);
    setActionSuccess(null);
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      slug: loc.slug,
      type: loc.type,
      parentId: typeof loc.parentId === 'object' ? loc.parentId?._id || loc.parentId?.id : loc.parentId || null,
      countryCode: loc.countryCode || '',
      stateCode: loc.stateCode || '',
      districtCode: loc.districtCode || '',
      cityCode: loc.cityCode || '',
      pincode: loc.pincode || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      aliases: loc.aliases || [],
      localizedNames: {
        en: loc.localizedNames?.en || loc.name,
        hi: loc.localizedNames?.hi || '',
        ar: loc.localizedNames?.ar || '',
        ur: loc.localizedNames?.ur || '',
      },
      description: loc.description || '',
      isActive: loc.isActive,
      isFeatured: loc.isFeatured,
      sortOrder: loc.sortOrder || 0,
    });
    setAliasInput((loc.aliases || []).join(', '));
    setIsCreateModalOpen(true);
  };

  // Handle Form Submit (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSubmitting(true);

    try {
      const aliasesArray = aliasInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CreateLocationInput = {
        ...formData,
        aliases: aliasesArray,
        localizedNames: {
          ...formData.localizedNames,
          en: formData.name,
        },
      };

      if (editingLocation) {
        const id = editingLocation.id || (editingLocation as any)._id;
        const res = await updateAdminLocation(id, payload);
        if (res.error) {
          setActionError(res.error);
          setSubmitting(false);
          return;
        }
        setActionSuccess(`Location "${payload.name}" updated successfully.`);
      } else {
        const res = await createAdminLocation(payload);
        if (res.error) {
          setActionError(res.error);
          setSubmitting(false);
          return;
        }
        setActionSuccess(`Location "${payload.name}" created successfully.`);
      }

      setIsCreateModalOpen(false);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save location.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Activate / Deactivate Toggle
  const handleToggleStatus = async (loc: LocationRecord) => {
    const id = loc.id || (loc as any)._id;
    setActionError(null);
    try {
      if (loc.isActive) {
        const res = await deactivateAdminLocation(id);
        if (res.error) setActionError(res.error);
        else setActionSuccess(`Location "${loc.name}" deactivated.`);
      } else {
        const res = await activateAdminLocation(id);
        if (res.error) setActionError(res.error);
        else setActionSuccess(`Location "${loc.name}" activated.`);
      }
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Status toggle failed.');
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmLocation) return;
    const id = deleteConfirmLocation.id || (deleteConfirmLocation as any)._id;
    setActionError(null);
    setSubmitting(true);

    try {
      const res = await deleteAdminLocation(id);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(`Location "${deleteConfirmLocation.name}" safely deleted.`);
        setDeleteConfirmLocation(null);
        await loadData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Delete operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for type badges
  const getTypeBadgeClass = (type: LocationType) => {
    switch (type) {
      case 'COUNTRY':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200';
      case 'STATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200';
      case 'DISTRICT':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200';
      case 'CITY':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200';
      case 'LOCALITY':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200';
      case 'SUB_LOCALITY':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200';
      case 'PINCODE':
        return 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300 border-stone-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Valid parents for dynamic dropdown based on selected type
  const getValidParentsForType = (type: LocationType) => {
    switch (type) {
      case 'COUNTRY':
        return [];
      case 'STATE':
        return locations.filter((l) => l.type === 'COUNTRY');
      case 'DISTRICT':
        return locations.filter((l) => l.type === 'STATE');
      case 'CITY':
        return locations.filter((l) => l.type === 'DISTRICT' || l.type === 'STATE');
      case 'LOCALITY':
        return locations.filter((l) => l.type === 'CITY');
      case 'SUB_LOCALITY':
        return locations.filter((l) => l.type === 'LOCALITY');
      case 'PINCODE':
        return locations.filter((l) => l.type === 'LOCALITY' || l.type === 'CITY');
      default:
        return locations;
    }
  };

  // Render Tree Node recursively
  const renderTreeNode = (node: LocationRecord, depth = 0) => {
    const id = node.id || (node as any)._id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(id);

    return (
      <div key={id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            node.isActive
              ? 'bg-casa-surface border-casa-border-light hover:border-casa-brand/40'
              : 'bg-casa-subtle/50 border-casa-border-light/60 opacity-75'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {/* Left Node Info */}
          <div className="flex items-center gap-2 overflow-hidden">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(id)}
                className="p-1 rounded-md hover:bg-casa-subtle text-casa-text-muted hover:text-casa-text-primary transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6 inline-block" />
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-casa-text-primary tracking-tight">
                {node.name}
              </span>

              {node.localizedNames?.hi && (
                <span className="text-xs text-casa-text-muted font-normal">
                  ({node.localizedNames.hi})
                </span>
              )}

              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(
                  node.type,
                )}`}
              >
                {node.type}
              </span>

              {node.pincode && (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-casa-subtle text-casa-text-secondary border border-casa-border-light">
                  📮 {node.pincode}
                </span>
              )}

              {node.isFeatured && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}

              {!node.isActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {node.propertyCount !== undefined && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-casa-brand-subtle text-casa-brand">
                {node.propertyCount} listings
              </span>
            )}

            {/* Add Child Shortcut */}
            {node.type !== 'PINCODE' && (
              <button
                type="button"
                title={`Add sub-location under ${node.name}`}
                onClick={() => handleOpenCreateModal(node)}
                className="p-1.5 rounded-lg text-casa-text-muted hover:text-casa-brand hover:bg-casa-brand-subtle transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {/* Edit */}
            <button
              type="button"
              title="Edit Location"
              onClick={() => handleOpenEditModal(node)}
              className="p-1.5 rounded-lg text-casa-text-muted hover:text-casa-brand hover:bg-casa-subtle transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Activate / Deactivate Toggle */}
            <button
              type="button"
              title={node.isActive ? 'Deactivate Location' : 'Activate Location'}
              onClick={() => handleToggleStatus(node)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                node.isActive
                  ? 'text-emerald-600 hover:bg-emerald-500/10'
                  : 'text-amber-600 hover:bg-amber-500/10'
              }`}
            >
              <Power className="w-4 h-4" />
            </button>

            {/* Safe Delete */}
            <button
              type="button"
              title="Delete Location"
              onClick={() => setDeleteConfirmLocation(node)}
              className="p-1.5 rounded-lg text-casa-text-muted hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children Subtree */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 pl-2 border-l-2 border-casa-border-light/60 ml-3">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary tracking-tight">
                Location Management & Geography Foundation
              </h1>
              <p className="text-xs md:text-sm text-casa-text-secondary mt-0.5">
                Centralized hierarchical administrative governance for verified countries, states, districts, cities, and micro-market localities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData()}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-casa-surface border border-casa-border-light hover:bg-casa-subtle text-casa-text-secondary transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-casa-brand text-white hover:bg-casa-brand-hover shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Location
          </button>
        </div>
      </div>

      {/* 2. Notification Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="cursor-pointer text-emerald-700">
            ×
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError(null)} className="cursor-pointer text-red-700">
            ×
          </button>
        </div>
      )}

      {/* 3. Search, Filter & View Controls */}
      <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, locality, alias, or pincode (e.g. Satellite, Amdavad, 380015)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand"
            />
            <Search className="w-4 h-4 text-casa-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
            >
              <option value="ALL">All Hierarchy Levels</option>
              <option value="COUNTRY">Country</option>
              <option value="STATE">State / Region</option>
              <option value="DISTRICT">District</option>
              <option value="CITY">City</option>
              <option value="LOCALITY">Locality / Area</option>
              <option value="SUB_LOCALITY">Sub-Locality</option>
              <option value="PINCODE">Pincode</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-casa-subtle rounded-xl border border-casa-border-light">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === 'tree'
                    ? 'bg-casa-surface text-casa-brand shadow-xs font-bold'
                    : 'text-casa-text-muted hover:text-casa-text-primary'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                Tree
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === 'table'
                    ? 'bg-casa-surface text-casa-brand shadow-xs font-bold'
                    : 'text-casa-text-muted hover:text-casa-text-primary'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Main Content: Tree View or Table View */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RotateCcw className="w-8 h-8 text-casa-brand animate-spin mx-auto" />
          <p className="text-xs text-casa-text-muted font-medium">Loading database locations...</p>
        </div>
      ) : viewMode === 'tree' ? (
        /* TREE VIEW */
        <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-casa-border-light">
            <h2 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-casa-brand" />
              <span>Geographic Hierarchy Structure ({tree.length} Root Nodes)</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const all = new Set<string>();
                  const collect = (nodes: LocationRecord[]) => {
                    nodes.forEach((n) => {
                      all.add(n.id || (n as any)._id);
                      if (n.children) collect(n.children);
                    });
                  };
                  collect(tree);
                  setExpandedNodes(all);
                }}
                className="text-[11px] font-semibold text-casa-brand hover:underline cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-casa-text-muted">•</span>
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set())}
                className="text-[11px] font-semibold text-casa-text-muted hover:text-casa-text-primary cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {tree.length === 0 ? (
            <div className="py-12 text-center text-casa-text-muted text-xs">
              No location hierarchy found. Click "Add New Location" to seed the root country node.
            </div>
          ) : (
            <div className="space-y-1 pt-1">{tree.map((rootNode) => renderTreeNode(rootNode, 0))}</div>
          )}
        </Card>
      ) : (
        /* TABLE LIST VIEW */
        <Card className="bg-casa-surface border border-casa-border-light shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-casa-subtle/60 text-casa-text-secondary border-b border-casa-border-light font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Name / Slugs</th>
                  <th className="p-3.5">Level Type</th>
                  <th className="p-3.5">Parent / Ancestry</th>
                  <th className="p-3.5">Pincode</th>
                  <th className="p-3.5">Aliases</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light text-casa-text-primary">
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-casa-text-muted">
                      No matching locations found for current filter.
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => {
                    const id = loc.id || (loc as any)._id;
                    const parentName = typeof loc.parentId === 'object' ? loc.parentId?.name : loc.parentId;

                    return (
                      <tr key={id} className="hover:bg-casa-subtle/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-casa-text-primary flex items-center gap-1.5">
                            {loc.name}
                            {loc.localizedNames?.hi && (
                              <span className="text-[11px] text-casa-text-muted font-normal">
                                ({loc.localizedNames.hi})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-casa-text-muted">/{loc.slug}</span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(
                              loc.type,
                            )}`}
                          >
                            {loc.type}
                          </span>
                        </td>

                        <td className="p-3.5 text-casa-text-secondary font-medium">
                          {parentName || <span className="text-casa-text-muted italic">Root (None)</span>}
                        </td>

                        <td className="p-3.5 font-mono text-casa-text-secondary">
                          {loc.pincode || '—'}
                        </td>

                        <td className="p-3.5 text-casa-text-secondary">
                          {loc.aliases && loc.aliases.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {loc.aliases.map((a) => (
                                <span key={a} className="px-1.5 py-0.5 text-[10px] rounded bg-casa-subtle border border-casa-border-light">
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="p-3.5">
                          {loc.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(loc)}
                              className="p-1 rounded-lg text-casa-text-muted hover:text-casa-brand hover:bg-casa-subtle cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(loc)}
                              className="p-1 rounded-lg text-casa-text-muted hover:text-amber-600 hover:bg-casa-subtle cursor-pointer"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmLocation(loc)}
                              className="p-1 rounded-lg text-casa-text-muted hover:text-red-600 hover:bg-casa-subtle cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. CREATE / EDIT LOCATION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-casa-border-light">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <MapPin className="w-5 h-5 text-casa-brand" />
                <span>{editingLocation ? `Edit Location: ${editingLocation.name}` : 'Add New Location Node'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-casa-text-muted hover:text-casa-text-primary text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Row 1: Type & Parent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    Location Type Level *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as LocationType;
                      setFormData({ ...formData, type: newType, parentId: newType === 'COUNTRY' ? null : formData.parentId });
                    }}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                  >
                    <option value="COUNTRY">Country</option>
                    <option value="STATE">State / Region</option>
                    <option value="DISTRICT">District</option>
                    <option value="CITY">City</option>
                    <option value="LOCALITY">Locality / Area</option>
                    <option value="SUB_LOCALITY">Sub-Locality</option>
                    <option value="PINCODE">Pincode</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    Parent Location {formData.type === 'COUNTRY' ? '(None for Country)' : '*'}
                  </label>
                  <select
                    disabled={formData.type === 'COUNTRY'}
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium disabled:opacity-50"
                  >
                    <option value="">-- Select Parent Location --</option>
                    {getValidParentsForType(formData.type).map((p) => (
                      <option key={p.id || (p as any)._id} value={p.id || (p as any)._id}>
                        {p.name} ({p.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    Location Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Satellite / Ahmedabad"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    URL Slug (Auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., satellite"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Multilingual Names */}
              <div className="p-3 bg-casa-subtle/50 rounded-xl border border-casa-border-light space-y-2">
                <span className="text-[11px] font-bold text-casa-text-secondary uppercase tracking-wider block">
                  Multi-lingual Localization
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-casa-text-muted block mb-0.5">Hindi (हिंदी)</label>
                    <input
                      type="text"
                      placeholder="e.g., अहमदाबाद"
                      value={formData.localizedNames?.hi || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          localizedNames: { ...formData.localizedNames!, hi: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-casa-text-muted block mb-0.5">Arabic (العربية)</label>
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="e.g., أحمد آباد"
                      value={formData.localizedNames?.ar || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          localizedNames: { ...formData.localizedNames!, ar: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-casa-text-muted block mb-0.5">Urdu (اردو)</label>
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="e.g., احمد آباد"
                      value={formData.localizedNames?.ur || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          localizedNames: { ...formData.localizedNames!, ur: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Pincode & Aliases */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    Postal Pincode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 380015"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    Search Aliases (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Amdavad, Ahmadabad"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              </div>

              {/* Row 5: Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g., 23.0225"
                    value={formData.latitude !== undefined ? formData.latitude : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g., 72.5714"
                    value={formData.longitude !== undefined ? formData.longitude : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono"
                  />
                </div>
              </div>

              {/* Row 6: Toggles & Sort */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-casa-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-casa-brand cursor-pointer"
                    />
                    <span>Active Location</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-casa-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-casa-brand cursor-pointer"
                    />
                    <span>Featured Highlight</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-casa-text-muted">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-center"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-casa-border-light">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-casa-canvas border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-casa-brand text-white hover:bg-casa-brand-hover disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SAFE DELETE CONFIRMATION MODAL */}
      {deleteConfirmLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-casa-text-primary">Confirm Location Deletion</h3>
                <p className="text-xs text-casa-text-secondary">Safety check & reference validation</p>
              </div>
            </div>

            <p className="text-xs text-casa-text-secondary leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-casa-text-primary">{deleteConfirmLocation.name}</strong> ({deleteConfirmLocation.type})?
            </p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
              ⚠️ If properties or child sub-locations reference this location, hard deletion will be safely blocked by CASA server governance. In such cases, consider deactivating the location instead.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmLocation(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-casa-canvas border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? 'Deleting...' : 'Delete Safely'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
