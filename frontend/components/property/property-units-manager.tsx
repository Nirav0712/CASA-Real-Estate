'use client';

import * as React from 'react';
import {
  PropertyStructureType,
  PropertyUnitDetails,
  UnitAvailabilityStatus,
  ProjectBuildingDetails,
  ListingType,
} from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  Home,
  Building,
  Layers,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  AlertCircle,
  X,
  Search,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface PropertyUnitsManagerProps {
  structureType: PropertyStructureType;
  onStructureTypeChange: (type: PropertyStructureType) => void;
  projectDetails: ProjectBuildingDetails;
  onProjectDetailsChange: (details: ProjectBuildingDetails) => void;
  units: PropertyUnitDetails[];
  onUnitsChange: (units: PropertyUnitDetails[]) => void;
}

const STRUCTURE_OPTIONS: {
  type: PropertyStructureType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    type: 'INDEPENDENT',
    label: 'Independent Property',
    desc: 'Single stand-alone villa, independent floor, house, or bungalow',
    icon: Home,
  },
  {
    type: 'MULTIPLE_UNITS_BUILDING',
    label: 'Multiple Units in One Building',
    desc: 'Single building with multiple floors & units (residential or commercial)',
    icon: Building,
  },
  {
    type: 'COMMERCIAL_BUILDING',
    label: 'Multiple Offices / Shops in a Commercial Building',
    desc: 'Floor-wise office spaces, retail shops, showrooms, or corporate units',
    icon: Layers,
  },
  {
    type: 'RESIDENTIAL_BUILDING',
    label: 'Multiple Apartments / Flats',
    desc: 'Apartment towers, multi-family flats across multiple floors',
    icon: Building,
  },
  {
    type: 'PLOTTED_DEVELOPMENT',
    label: 'Multiple Plots in a Project',
    desc: 'Plotted township, layout scheme with multiple plot sizes & dimensions',
    icon: MapPin,
  },
  {
    type: 'PROJECT_UNITS',
    label: 'Multiple Units in a Project',
    desc: 'Large complex with multiple towers, floors, and unit variants',
    icon: Sparkles,
  },
];

const AVAILABILITY_STATUSES: {
  value: UnitAvailabilityStatus;
  label: string;
  badgeClass: string;
}[] = [
  { value: 'AVAILABLE', label: 'Available', badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  { value: 'UNDER_OFFER', label: 'Under Offer', badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  { value: 'SOLD', label: 'Sold Out', badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
  { value: 'RENTED', label: 'Rented Out', badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  { value: 'RESERVED', label: 'Reserved', badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
];

export function PropertyUnitsManager({
  structureType,
  onStructureTypeChange,
  projectDetails,
  onProjectDetailsChange,
  units,
  onUnitsChange,
}: PropertyUnitsManagerProps) {
  const isMultiUnit = structureType !== 'INDEPENDENT';
  const isPlotted = structureType === 'PLOTTED_DEVELOPMENT';

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Unit Editor Form State
  const [unitForm, setUnitForm] = React.useState<PropertyUnitDetails>({
    unitId: '',
    unitNumber: '',
    floorNumber: '1',
    towerName: '',
    unitType: isPlotted ? 'Residential Plot' : 'Office',
    carpetArea: 500,
    builtUpArea: 600,
    superBuiltUpArea: 750,
    areaUnit: 'SQ_FT',
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    facing: 'East',
    furnishing: 'SEMI_FURNISHED',
    amenities: [],
    possessionStatus: 'READY_TO_MOVE',
    availabilityStatus: 'AVAILABLE',
    listingType: 'SALE',
    price: 3500000,
    pricePerSqFt: 7000,
    monthlyRent: 25000,
    securityDeposit: 50000,
    maintenanceCharges: 2000,
    preferredTenantType: 'FAMILY',
    bachelorPreferences: 'NOT_APPLICABLE',
    availableFrom: '',
    photos: [],
    documents: [],

    // Plot fields
    plotNumber: '',
    plotType: 'Residential Plot',
    plotArea: 1200,
    plotLength: 40,
    plotWidth: 30,
    frontage: 30,
    roadWidth: 40,
    cornerPlot: false,
    openSides: 1,
  });

  // Table filter state
  const [tableSearch, setTableSearch] = React.useState('');
  const [tableFloorFilter, setTableFloorFilter] = React.useState('ALL');
  const [tableStatusFilter, setTableStatusFilter] = React.useState('ALL');

  // Stats calculation
  const totalUnits = units.length;
  const availableCount = units.filter((u) => u.availabilityStatus === 'AVAILABLE').length;
  const underOfferCount = units.filter((u) => u.availabilityStatus === 'UNDER_OFFER').length;
  const closedCount = units.filter((u) => u.availabilityStatus === 'SOLD' || u.availabilityStatus === 'RENTED').length;

  const distinctFloors = React.useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => {
      if (u.floorNumber) set.add(u.floorNumber);
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [units]);

  // Open Modal to Add
  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setModalError(null);
    const newId = `u-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    setUnitForm({
      unitId: newId,
      unitNumber: isPlotted ? `Plot ${units.length + 1}` : `${(units.length % 5) + 1}0${Math.floor(units.length / 5) + 1}`,
      floorNumber: isPlotted ? undefined : String(Math.floor(units.length / 4) + 1),
      towerName: projectDetails.towerName || (projectDetails.totalTowers && projectDetails.totalTowers > 1 ? 'Tower A' : ''),
      unitType: isPlotted
        ? 'Residential Plot'
        : structureType === 'COMMERCIAL_BUILDING'
        ? 'Office'
        : structureType === 'RESIDENTIAL_BUILDING'
        ? 'Apartment'
        : 'Unit',
      carpetArea: isPlotted ? undefined : 650,
      builtUpArea: isPlotted ? undefined : 780,
      superBuiltUpArea: isPlotted ? undefined : 900,
      areaUnit: 'SQ_FT',
      bedrooms: structureType === 'COMMERCIAL_BUILDING' ? undefined : 2,
      bathrooms: 2,
      balconies: 1,
      facing: 'East',
      furnishing: 'SEMI_FURNISHED',
      amenities: [],
      possessionStatus: 'READY_TO_MOVE',
      availabilityStatus: 'AVAILABLE',
      listingType: 'SALE',
      price: 4500000,
      pricePerSqFt: 5000,
      monthlyRent: 25000,
      securityDeposit: 50000,
      maintenanceCharges: 2500,
      preferredTenantType: 'FAMILY',
      bachelorPreferences: 'NOT_APPLICABLE',
      availableFrom: '',
      photos: [],
      documents: [],

      // Plotted
      plotNumber: isPlotted ? `Plot ${units.length + 1}` : undefined,
      plotType: 'Residential Plot',
      plotArea: isPlotted ? 1200 : undefined,
      plotLength: isPlotted ? 40 : undefined,
      plotWidth: isPlotted ? 30 : undefined,
      frontage: 30,
      roadWidth: 40,
      cornerPlot: false,
      openSides: 1,
    });
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEditModal = (idx: number) => {
    setEditingIndex(idx);
    setModalError(null);
    setUnitForm({ ...units[idx] });
    setIsModalOpen(true);
  };

  // Duplicate a unit
  const handleDuplicate = (idx: number) => {
    const target = units[idx];
    const newId = `u-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const copy: PropertyUnitDetails = {
      ...target,
      unitId: newId,
      unitNumber: `${target.unitNumber || target.plotNumber || 'Unit'}-copy`,
      plotNumber: target.plotNumber ? `${target.plotNumber}-copy` : undefined,
      availabilityStatus: 'AVAILABLE',
    };
    onUnitsChange([...units, copy]);
  };

  // Delete a unit
  const handleDelete = (idx: number) => {
    const updated = units.filter((_, i) => i !== idx);
    onUnitsChange(updated);
  };

  // Toggle unit availability status directly
  const handleToggleAvailability = (idx: number, status: UnitAvailabilityStatus) => {
    const updated = [...units];
    updated[idx] = { ...updated[idx], availabilityStatus: status };
    onUnitsChange(updated);
  };

  // Save Modal
  const handleSaveModal = () => {
    const identifier = (isPlotted ? unitForm.plotNumber : unitForm.unitNumber)?.trim();
    if (!identifier) {
      setModalError(isPlotted ? 'Plot Number is required.' : 'Unit Number is required.');
      return;
    }

    // Check duplicate
    const duplicate = units.some((u, i) => {
      if (editingIndex !== null && editingIndex === i) return false;
      if (isPlotted) {
        return (u.plotNumber || u.unitNumber || '').toLowerCase() === identifier.toLowerCase();
      } else {
        const sameFloor = (u.floorNumber || '') === (unitForm.floorNumber || '');
        const sameTower = (u.towerName || '') === (unitForm.towerName || '');
        const sameUnit = (u.unitNumber || '').toLowerCase() === identifier.toLowerCase();
        return sameFloor && sameTower && sameUnit;
      }
    });

    if (duplicate) {
      setModalError(
        isPlotted
          ? `Plot number "${identifier}" already exists in this project layout.`
          : `Unit "${identifier}" already exists on floor ${unitForm.floorNumber || '0'}${unitForm.towerName ? ` in ${unitForm.towerName}` : ''}. Duplicate numbers are prohibited.`
      );
      return;
    }

    if (!unitForm.price || Number(unitForm.price) <= 0) {
      if (unitForm.listingType === 'RENT' || unitForm.listingType === 'COMMERCIAL_LEASE') {
        if (!unitForm.monthlyRent || Number(unitForm.monthlyRent) <= 0) {
          setModalError('Valid monthly rent is required.');
          return;
        }
      } else {
        setModalError('Valid price is required.');
        return;
      }
    }

    // Area sensible validation
    const areaVal = isPlotted ? unitForm.plotArea : unitForm.carpetArea || unitForm.builtUpArea;
    if (!areaVal || Number(areaVal) <= 0) {
      setModalError('Valid area must be greater than zero.');
      return;
    }

    const cleaned: PropertyUnitDetails = {
      ...unitForm,
      unitNumber: identifier,
      plotNumber: isPlotted ? identifier : undefined,
      price: Number(unitForm.price) || 0,
      monthlyRent: unitForm.monthlyRent ? Number(unitForm.monthlyRent) : undefined,
      securityDeposit: unitForm.securityDeposit ? Number(unitForm.securityDeposit) : undefined,
      maintenanceCharges: unitForm.maintenanceCharges ? Number(unitForm.maintenanceCharges) : undefined,
      carpetArea: unitForm.carpetArea ? Number(unitForm.carpetArea) : undefined,
      builtUpArea: unitForm.builtUpArea ? Number(unitForm.builtUpArea) : undefined,
      superBuiltUpArea: unitForm.superBuiltUpArea ? Number(unitForm.superBuiltUpArea) : undefined,
      plotArea: unitForm.plotArea ? Number(unitForm.plotArea) : undefined,
      plotLength: unitForm.plotLength ? Number(unitForm.plotLength) : undefined,
      plotWidth: unitForm.plotWidth ? Number(unitForm.plotWidth) : undefined,
      roadWidth: unitForm.roadWidth ? Number(unitForm.roadWidth) : undefined,
      frontage: unitForm.frontage ? Number(unitForm.frontage) : undefined,
    };

    if (editingIndex !== null) {
      const updated = [...units];
      updated[editingIndex] = cleaned;
      onUnitsChange(updated);
    } else {
      onUnitsChange([...units, cleaned]);
    }

    setIsModalOpen(false);
  };

  // Filtered units for the preview table
  const filteredUnits = React.useMemo(() => {
    return units.filter((u) => {
      const idStr = (u.unitNumber || u.plotNumber || '').toLowerCase();
      const typeStr = (u.unitType || u.plotType || '').toLowerCase();
      const matchSearch = !tableSearch.trim() || idStr.includes(tableSearch.toLowerCase()) || typeStr.includes(tableSearch.toLowerCase());
      const matchFloor = tableFloorFilter === 'ALL' || u.floorNumber === tableFloorFilter;
      const matchStatus = tableStatusFilter === 'ALL' || u.availabilityStatus === tableStatusFilter;
      return matchSearch && matchFloor && matchStatus;
    });
  }, [units, tableSearch, tableFloorFilter, tableStatusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Property Structure Selector */}
      <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
          <div>
            <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
              <Building className="w-4 h-4 text-casa-brand" />
              <span>Property Structure & Inventory Hierarchy</span>
            </h3>
            <p className="text-xs text-casa-text-secondary mt-0.5">
              Choose whether this listing is an independent property or a multi-unit complex / plotted development.
            </p>
          </div>
          {isMultiUnit && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-casa-brand-subtle text-casa-brand border border-casa-brand/20">
              Multi-Unit Architecture Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STRUCTURE_OPTIONS.map((opt) => {
            const isSelected = structureType === opt.type;
            const IconComp = opt.icon;
            return (
              <button
                type="button"
                key={opt.type}
                onClick={() => onStructureTypeChange(opt.type)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-casa-brand bg-casa-brand-subtle ring-2 ring-casa-brand/30 shadow-xs'
                    : 'border-casa-border-light bg-casa-canvas hover:border-casa-border-dark'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-casa-brand text-white' : 'bg-casa-subtle text-casa-text-secondary'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-casa-brand stroke-[2.5]" />}
                  </div>
                  <h4 className={`text-xs font-bold leading-snug ${isSelected ? 'text-casa-brand' : 'text-casa-text-primary'}`}>
                    {opt.label}
                  </h4>
                  <p className="text-[11px] text-casa-text-muted mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Project / Building Details (Shown when Multi-Unit or Plotted) */}
      {isMultiUnit && (
        <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-5 shadow-subtle space-y-4">
          <div className="border-b border-casa-border-light pb-3">
            <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
              <Building className="w-4 h-4 text-casa-brand" />
              <span>Project / Building Details</span>
            </h3>
            <p className="text-xs text-casa-text-secondary mt-0.5">
              Specify the overarching project, complex, or layout details that all units or plots belong to.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                {isPlotted ? 'Project / Layout Name *' : 'Project / Complex Name *'}
              </label>
              <input
                type="text"
                placeholder={isPlotted ? 'e.g., Green Valley Plotted Township' : 'e.g., Sunrise Business Centre'}
                value={projectDetails.projectName || ''}
                onChange={(e) => onProjectDetailsChange({ ...projectDetails, projectName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                {isPlotted ? 'Phase / Sector' : 'Building / Tower Name'}
              </label>
              <input
                type="text"
                placeholder={isPlotted ? 'e.g., Sector 4A / Phase 1' : 'e.g., Tower B / Commercial Block'}
                value={projectDetails.buildingName || projectDetails.towerName || ''}
                onChange={(e) =>
                  onProjectDetailsChange({
                    ...projectDetails,
                    buildingName: e.target.value,
                    towerName: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Building Number, if applicable
              </label>
              <input
                type="text"
                placeholder="e.g., Plot #14, B-Wing"
                value={projectDetails.buildingNumber || ''}
                onChange={(e) => onProjectDetailsChange({ ...projectDetails, buildingNumber: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                {isPlotted ? 'Total Plots Planned' : 'Total Floors in Building'}
              </label>
              <input
                type="number"
                min="1"
                placeholder={isPlotted ? 'e.g., 50' : 'e.g., 14'}
                value={projectDetails.totalFloors || ''}
                onChange={(e) =>
                  onProjectDetailsChange({
                    ...projectDetails,
                    totalFloors: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Developer / Owner Name
              </label>
              <input
                type="text"
                placeholder="e.g., Casa Group Infrastructure Ltd"
                value={projectDetails.developerName || ''}
                onChange={(e) => onProjectDetailsChange({ ...projectDetails, developerName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Project RERA Number, where applicable
              </label>
              <input
                type="text"
                placeholder="e.g., UPRERA-PRJ-2024-98432"
                value={projectDetails.projectRera?.reraNumber || ''}
                onChange={(e) =>
                  onProjectDetailsChange({
                    ...projectDetails,
                    projectRera: {
                      ...(projectDetails.projectRera || { verificationStatus: 'PENDING' }),
                      reraNumber: e.target.value,
                      isReraRegistered: e.target.value ? 'YES' : 'NO',
                    },
                  })
                }
                className="w-full px-3.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium font-mono"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Project Full Address / Master Site Location
              </label>
              <input
                type="text"
                placeholder="e.g., Sector 128, Golf Course Road, Lucknow, Uttar Pradesh"
                value={projectDetails.projectAddress || ''}
                onChange={(e) => onProjectDetailsChange({ ...projectDetails, projectAddress: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Dynamic Units / Plots Inventory Card */}
      {isMultiUnit && (
        <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-casa-border-light pb-4">
            <div>
              <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-casa-brand" />
                <span>{isPlotted ? 'Plotted Layout Inventory' : 'Independently Listable Units Inventory'}</span>
              </h3>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Each unit or plot has its own size, price, availability status, and floor-wise positioning.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs w-fit"
            >
              <Plus className="w-4 h-4" />
              <span>{isPlotted ? 'Add Plot' : 'Add Unit'}</span>
            </button>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-casa-canvas border border-casa-border-light">
              <span className="text-[10px] font-semibold text-casa-text-muted uppercase">Total Listed</span>
              <p className="text-lg font-extrabold text-casa-text-primary mt-0.5">{totalUnits}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Available</span>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{availableCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase">Under Offer</span>
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{underOfferCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase">Sold / Rented</span>
              <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{closedCount}</p>
            </div>
          </div>

          {/* Filter Toolbar */}
          {units.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-casa-text-muted absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isPlotted ? 'Search plot number or type...' : 'Search unit number, floor, or type...'}
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full ps-8 pe-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                />
              </div>

              {!isPlotted && distinctFloors.length > 0 && (
                <select
                  value={tableFloorFilter}
                  onChange={(e) => setTableFloorFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                >
                  <option value="ALL">All Floors ({units.length})</option>
                  {distinctFloors.map((f) => (
                    <option key={f} value={f}>
                      Floor {f}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={tableStatusFilter}
                onChange={(e) => setTableStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              >
                <option value="ALL">All Statuses</option>
                {AVAILABILITY_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Inventory Table */}
          {units.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-casa-border-light rounded-2xl bg-casa-canvas/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-casa-brand-subtle text-casa-brand flex items-center justify-center mx-auto">
                {isPlotted ? <MapPin className="w-6 h-6" /> : <Building className="w-6 h-6" />}
              </div>
              <h4 className="text-xs font-bold text-casa-text-primary">
                {isPlotted ? 'No Plots Added Yet' : 'No Units Added Yet'}
              </h4>
              <p className="text-xs text-casa-text-muted max-w-sm mx-auto">
                {isPlotted
                  ? 'Add your individual plots with custom dimensions, area, and independent pricing.'
                  : 'Add your individual offices, apartments, or shops with their own sizes, floor numbers, and prices.'}
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isPlotted ? 'Add First Plot' : 'Add First Unit'}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-casa-border-light">
              <table className="w-full text-start text-xs border-collapse">
                <thead className="bg-casa-subtle/60 text-casa-text-muted font-bold uppercase text-[10px] tracking-wider border-b border-casa-border-light">
                  <tr>
                    <th className="py-2.5 px-3 text-start">{isPlotted ? 'Plot #' : 'Unit / Flat #'}</th>
                    {!isPlotted && <th className="py-2.5 px-3 text-start">Floor & Tower</th>}
                    <th className="py-2.5 px-3 text-start">Type</th>
                    <th className="py-2.5 px-3 text-start">Area / Dimensions</th>
                    <th className="py-2.5 px-3 text-start">Purpose & Price</th>
                    <th className="py-2.5 px-3 text-start">Availability Status</th>
                    <th className="py-2.5 px-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-casa-border-light bg-casa-surface">
                  {filteredUnits.map((u, i) => {
                    const originalIndex = units.findIndex((x) => x.unitId === u.unitId);
                    const isRent = u.listingType === 'RENT' || u.listingType === 'COMMERCIAL_LEASE';
                    return (
                      <tr key={u.unitId} className="hover:bg-casa-canvas/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-casa-text-primary font-mono">
                          {u.unitNumber || u.plotNumber}
                        </td>
                        {!isPlotted && (
                          <td className="py-3 px-3 text-casa-text-secondary">
                            Floor {u.floorNumber || 'N/A'} {u.towerName ? `• ${u.towerName}` : ''}
                          </td>
                        )}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-casa-subtle text-casa-text-primary text-[11px] font-semibold">
                            {u.unitType || u.plotType || 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-casa-text-secondary">
                          {isPlotted ? (
                            <div>
                              <span className="font-semibold text-casa-text-primary">{u.plotArea || 0} sq.ft.</span>
                              {u.plotLength && u.plotWidth && (
                                <span className="text-[10px] text-casa-text-muted block">
                                  {u.plotLength} × {u.plotWidth} ft {u.cornerPlot ? '• Corner' : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-casa-text-primary">{u.carpetArea || u.builtUpArea || 0} sq.ft.</span>
                              <span className="text-[10px] text-casa-text-muted block">
                                Carpet: {u.carpetArea || '-'} | Built: {u.builtUpArea || '-'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-casa-brand">
                          {isRent ? (
                            <div>
                              <span>₹{(u.monthlyRent || 0).toLocaleString()}/mo</span>
                              <span className="text-[10px] text-casa-text-muted font-normal block">Rent</span>
                            </div>
                          ) : (
                            <div>
                              <span>{formatPrice(u.price)}</span>
                              {u.pricePerSqFt && (
                                <span className="text-[10px] text-casa-text-muted font-normal block">
                                  ₹{u.pricePerSqFt}/sq.ft
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={u.availabilityStatus}
                            onChange={(e) =>
                              handleToggleAvailability(originalIndex, e.target.value as UnitAvailabilityStatus)
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                              AVAILABILITY_STATUSES.find((s) => s.value === u.availabilityStatus)?.badgeClass ||
                              'bg-casa-subtle text-casa-text-primary'
                            }`}
                          >
                            {AVAILABILITY_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(originalIndex)}
                              title="Edit Unit"
                              className="p-1.5 rounded-lg hover:bg-casa-subtle text-casa-text-secondary hover:text-casa-brand transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(originalIndex)}
                              title="Duplicate Unit"
                              className="p-1.5 rounded-lg hover:bg-casa-subtle text-casa-text-secondary hover:text-casa-brand transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(originalIndex)}
                              title="Delete Unit"
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-casa-text-secondary hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Add / Edit Unit / Plot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
              <div>
                <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                  <span>{editingIndex !== null ? (isPlotted ? 'Edit Plot Details' : 'Edit Unit Details') : isPlotted ? 'Add New Plot' : 'Add New Unit'}</span>
                </h3>
                <p className="text-xs text-casa-text-secondary mt-0.5">
                  {isPlotted
                    ? 'Configure plot dimensions, road frontage, pricing, and availability.'
                    : 'Configure floor number, carpet area, specification, and individual price.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-casa-subtle text-casa-text-muted hover:text-casa-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Row 1: Identification & Positioning */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    {isPlotted ? 'Plot Number *' : 'Unit / Flat / Office Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isPlotted ? 'e.g., A-102' : 'e.g., 201'}
                    value={isPlotted ? unitForm.plotNumber || unitForm.unitNumber : unitForm.unitNumber}
                    onChange={(e) =>
                      setUnitForm({
                        ...unitForm,
                        unitNumber: e.target.value,
                        plotNumber: isPlotted ? e.target.value : undefined,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-bold font-mono"
                  />
                </div>

                {!isPlotted && (
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      Floor Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 1, 2, Ground, Penthouse"
                      value={unitForm.floorNumber || ''}
                      onChange={(e) => setUnitForm({ ...unitForm, floorNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    {isPlotted ? 'Plot Type' : 'Unit Type'}
                  </label>
                  <input
                    type="text"
                    placeholder={isPlotted ? 'e.g., Residential Plot' : 'e.g., Office, 2 BHK, Shop'}
                    value={isPlotted ? unitForm.plotType || '' : unitForm.unitType || ''}
                    onChange={(e) =>
                      setUnitForm({
                        ...unitForm,
                        unitType: e.target.value,
                        plotType: isPlotted ? e.target.value : undefined,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                  />
                </div>
              </div>

              {/* Row 2: Dimensions & Area */}
              {isPlotted ? (
                <div className="space-y-3 p-3.5 rounded-xl bg-casa-canvas border border-casa-border-light">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-casa-text-primary">Plot Dimensions & Area</span>
                    <span className="text-[10px] text-casa-text-muted">Sensible validation for regular or irregular plots</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                        Plot Area (sq.ft.) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={unitForm.plotArea || ''}
                        onChange={(e) => setUnitForm({ ...unitForm, plotArea: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                        Plot Length (ft)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={unitForm.plotLength || ''}
                        onChange={(e) => {
                          const l = Number(e.target.value);
                          const w = unitForm.plotWidth || 0;
                          setUnitForm({
                            ...unitForm,
                            plotLength: l,
                            plotArea: l > 0 && w > 0 ? l * w : unitForm.plotArea,
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                        Plot Width (ft)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={unitForm.plotWidth || ''}
                        onChange={(e) => {
                          const w = Number(e.target.value);
                          const l = unitForm.plotLength || 0;
                          setUnitForm({
                            ...unitForm,
                            plotWidth: w,
                            plotArea: l > 0 && w > 0 ? l * w : unitForm.plotArea,
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                        Road Width (ft)
                      </label>
                      <input
                        type="number"
                        value={unitForm.roadWidth || ''}
                        onChange={(e) => setUnitForm({ ...unitForm, roadWidth: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-casa-text-primary">
                      <input
                        type="checkbox"
                        checked={Boolean(unitForm.cornerPlot)}
                        onChange={(e) => setUnitForm({ ...unitForm, cornerPlot: e.target.checked })}
                        className="rounded text-casa-brand"
                      />
                      <span>Corner Plot (Multi-facing)</span>
                    </label>
                    <div className="flex items-center gap-2 text-xs text-casa-text-secondary">
                      <span>Open Sides:</span>
                      <select
                        value={unitForm.openSides || 1}
                        onChange={(e) => setUnitForm({ ...unitForm, openSides: Number(e.target.value) })}
                        className="px-2 py-1 bg-casa-surface border border-casa-border-light rounded-md text-xs"
                      >
                        <option value={1}>1 Side Open</option>
                        <option value={2}>2 Sides Open</option>
                        <option value={3}>3 Sides Open</option>
                        <option value={4}>4 Sides Open (Independent)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      Carpet Area (sq.ft.) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={unitForm.carpetArea || ''}
                      onChange={(e) =>
                        setUnitForm({
                          ...unitForm,
                          carpetArea: Number(e.target.value),
                          builtUpArea: unitForm.builtUpArea || Math.round(Number(e.target.value) * 1.15),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      Built-up Area (sq.ft.)
                    </label>
                    <input
                      type="number"
                      value={unitForm.builtUpArea || ''}
                      onChange={(e) => setUnitForm({ ...unitForm, builtUpArea: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      Super Built-up Area (sq.ft.)
                    </label>
                    <input
                      type="number"
                      value={unitForm.superBuiltUpArea || ''}
                      onChange={(e) => setUnitForm({ ...unitForm, superBuiltUpArea: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Row 3: Listing Purpose, Pricing & Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    Listing Purpose *
                  </label>
                  <select
                    value={unitForm.listingType}
                    onChange={(e) => setUnitForm({ ...unitForm, listingType: e.target.value as ListingType })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-medium"
                  >
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                    <option value="LEASE">Lease</option>
                    <option value="COMMERCIAL_LEASE">Commercial Lease</option>
                  </select>
                </div>

                {unitForm.listingType === 'RENT' || unitForm.listingType === 'COMMERCIAL_LEASE' ? (
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      Monthly Rent (₹) *
                    </label>
                    <input
                      type="number"
                      value={unitForm.monthlyRent || ''}
                      onChange={(e) => setUnitForm({ ...unitForm, monthlyRent: Number(e.target.value), price: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-bold text-casa-brand"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      Sale Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={unitForm.price || ''}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        const a = isPlotted ? unitForm.plotArea : unitForm.carpetArea;
                        setUnitForm({
                          ...unitForm,
                          price: p,
                          pricePerSqFt: p > 0 && a && a > 0 ? Math.round(p / a) : unitForm.pricePerSqFt,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-bold text-casa-brand"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    Availability Status *
                  </label>
                  <select
                    value={unitForm.availabilityStatus}
                    onChange={(e) => setUnitForm({ ...unitForm, availabilityStatus: e.target.value as UnitAvailabilityStatus })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-bold"
                  >
                    {AVAILABILITY_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rental specifics if Rent */}
              {(unitForm.listingType === 'RENT' || unitForm.listingType === 'COMMERCIAL_LEASE') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div>
                    <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      value={unitForm.securityDeposit || ''}
                      onChange={(e) => setUnitForm({ ...unitForm, securityDeposit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                      Maintenance Charges (₹/mo)
                    </label>
                    <input
                      type="number"
                      value={unitForm.maintenanceCharges || ''}
                      onChange={(e) => setUnitForm({ ...unitForm, maintenanceCharges: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                      Preferred Tenant
                    </label>
                    <select
                      value={unitForm.preferredTenantType || 'FAMILY'}
                      onChange={(e) => setUnitForm({ ...unitForm, preferredTenantType: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg"
                    >
                      <option value="FAMILY">Family Only</option>
                      <option value="BACHELORS">Bachelors</option>
                      <option value="ANY">Family / Bachelors / Any</option>
                      <option value="COMPANY_LEASE">Corporate / Company Lease</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Facing & Furnishing */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Facing</label>
                  <select
                    value={unitForm.facing || 'East'}
                    onChange={(e) => setUnitForm({ ...unitForm, facing: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl"
                  >
                    <option value="East">East</option>
                    <option value="North">North</option>
                    <option value="North-East">North-East</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                    <option value="South-East">South-East</option>
                  </select>
                </div>

                {!isPlotted && (
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">Furnishing</label>
                    <select
                      value={unitForm.furnishing || 'SEMI_FURNISHED'}
                      onChange={(e) => setUnitForm({ ...unitForm, furnishing: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl"
                    >
                      <option value="FURNISHED">Fully Furnished</option>
                      <option value="SEMI_FURNISHED">Semi Furnished</option>
                      <option value="UNFURNISHED">Unfurnished</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Available From</label>
                  <input
                    type="date"
                    value={unitForm.availableFrom || ''}
                    onChange={(e) => setUnitForm({ ...unitForm, availableFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-casa-border-light pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-casa-brand hover:bg-casa-brand-hover transition-colors cursor-pointer shadow-2xs"
              >
                {editingIndex !== null ? 'Update Inventory' : 'Save Unit to Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
