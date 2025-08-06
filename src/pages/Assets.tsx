import React, { useState, useEffect } from 'react';
import { useAssetStore } from '../store/assetStore';
import { useRoleStore } from '../store/roleStore';
import { Plus, FileDown, Filter, ChevronDown } from 'lucide-react';
import AssetTable from '../components/AssetTable';
import AssetModal from '../components/AssetModal';
import ImportExportModal from '../components/ImportExportModal';
import {
  Asset,
  AssetDepartment,
  departmentLabels,
  categoryLabels
} from '../types/asset';

export default function Assets() {
  const { 
    assets, 
    loading, 
    error,
    depreciationGroups,
    fetchAssets,
    createAsset, 
    updateAsset,
    deleteAsset
  } = useAssetStore();

  const {
    fetchUserRoles,
    isAdmin,
    permissionLevel,
    currentDepartment,
    currentCategory,
    hasPermission,
    setCurrentDepartment,
    setCurrentCategory
  } = useRoleStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Enhanced year filtering
  const [yearFilterType, setYearFilterType] = useState<'single' | 'range' | 'multiple' | 'before'>('single');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [yearRange, setYearRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [yearThreshold, setYearThreshold] = useState<string>('');
  
  // Enhanced department filtering
  const [includePreviousDepartments, setIncludePreviousDepartments] = useState(false);
  const [departmentOrder, setDepartmentOrder] = useState<AssetDepartment[]>([]);

  useEffect(() => {
    fetchAssets();
    fetchUserRoles();
  }, [fetchAssets, fetchUserRoles]);

  useEffect(() => {
    // Set department order when assets are loaded
    const deptList = [...new Set(assets.map(asset => asset.department))];
    setDepartmentOrder(deptList as AssetDepartment[]);
  }, [assets]);

  const years = [...new Set(assets.map(asset => asset.year))].sort((a, b) => b - a);

  // Filter assets based on permissions and filters
  const filteredAssets = assets.filter(asset => {
    // Department filtering with "include previous" feature
    if (currentDepartment) {
      if (!includePreviousDepartments) {
        if (asset.department !== currentDepartment) {
          return false;
        }
      } else {
        const currentDeptIndex = departmentOrder.indexOf(currentDepartment);
        const assetDeptIndex = departmentOrder.indexOf(asset.department);
        
        // Only include if asset department is before or same as selected department in the order
        if (currentDeptIndex === -1 || assetDeptIndex === -1 || assetDeptIndex > currentDeptIndex) {
          return false;
        }
      }
    }
  
    if (currentCategory && asset.category !== currentCategory) {
      return false;
    }

    // Enhanced year filtering based on selected method
    switch (yearFilterType) {
      case 'single':
        if (selectedYear !== 'all' && asset.year.toString() !== selectedYear) {
          return false;
        }
        break;
      case 'multiple':
        if (selectedYears.length > 0 && !selectedYears.includes(asset.year)) {
          return false;
        }
        break;
      case 'range':
        if (yearRange.start && yearRange.end) {
          const startYear = parseInt(yearRange.start);
          const endYear = parseInt(yearRange.end);
          if (asset.year < startYear || asset.year > endYear) {
            return false;
          }
        }
        break;
      case 'before':
        if (yearThreshold && asset.year > parseInt(yearThreshold)) {
          return false;
        }
        break;
    }
  
    return true;
  });

  // Calculate totals for filtered assets
  const assetTotals = filteredAssets.reduce((acc, asset) => {
    const currentYear = new Date().getFullYear();
    const assetAge = currentYear - asset.year;
    const depGroup = depreciationGroups.find(g => g.id === asset.depreciation_group_id);
    
    // Calculate depreciation
    let accumulatedDepreciation = 0;
    let currentYearDepreciation = 0;
    
    if (depGroup) {
      // Check if asset is already fully depreciated (book_value is 0)
      if (asset.book_value === 0) {
        // Asset is fully depreciated
        accumulatedDepreciation = asset.acquisition_value;
        currentYearDepreciation = 0;
      } 
      // Check if asset has minimum book value (1 rupiah)
      else if (asset.book_value === 1) {
        // Asset is practically fully depreciated with minimum value
        accumulatedDepreciation = asset.acquisition_value - 1;
        currentYearDepreciation = 0;
      }
      else {
        const yearlyDepreciation = asset.acquisition_value * depGroup.rate;
        
        // Previous years' depreciation (excluding current year)
        if (assetAge > 1) {
          const calculatedAccumulatedDep = yearlyDepreciation * (assetAge - 1);
          accumulatedDepreciation = Math.min(
            calculatedAccumulatedDep,
            asset.acquisition_value - 1 // Cap at acquisition value minus 1 rupiah
          );
        }
        
        // Current year's depreciation - only apply if we haven't reached minimum value
        if (assetAge > 0) {
          const remainingValue = asset.acquisition_value - accumulatedDepreciation;
          if (remainingValue > yearlyDepreciation + 1) {
            currentYearDepreciation = yearlyDepreciation;
          } else if (remainingValue > 1) {
            currentYearDepreciation = remainingValue - 1; // Depreciate to minimum 1 rupiah
          } else {
            currentYearDepreciation = 0; // Already at minimum value
          }
        }
      }
    }

    return {
      acquisitionValue: acc.acquisitionValue + asset.acquisition_value,
      accumulatedDepreciation: acc.accumulatedDepreciation + accumulatedDepreciation,
      currentYearDepreciation: acc.currentYearDepreciation + currentYearDepreciation,
      bookValue: acc.bookValue + asset.book_value
    };
  }, {
    acquisitionValue: 0,
    accumulatedDepreciation: 0,
    currentYearDepreciation: 0,
    bookValue: 0
  });

  const handleEdit = (asset: Asset) => {
    if (!hasPermission(asset.department, asset.category, 'update')) {
      alert('You do not have permission to edit this asset');
      return;
    }
    setEditingAsset(asset);
    setShowAddModal(true);
  };

  const handleImport = async (assets: Partial<Asset>[]) => {
    for (const asset of assets) {
      await createAsset(asset as any);
    }
  };

  const handleAddNew = () => {
    if (permissionLevel === 'viewer' || permissionLevel === 'department') {
      alert('You do not have permission to add new assets');
      return;
    }
    setEditingAsset(null);
    setShowAddModal(true);
  };
  
  const handleYearFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'single' | 'range' | 'multiple' | 'before';
    setYearFilterType(type);
    
    // Reset values when changing filter type
    setSelectedYear('all');
    setSelectedYears([]);
    setYearRange({ start: '', end: '' });
    setYearThreshold('');
  };
  
  const handleYearSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: number[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value));
      }
    }
    
    setSelectedYears(selectedValues);
  };
  
  const toggleYearSelection = (year: number) => {
    const index = selectedYears.indexOf(year);
    if (index === -1) {
      setSelectedYears([...selectedYears, year]);
    } else {
      const updatedYears = [...selectedYears];
      updatedYears.splice(index, 1);
      setSelectedYears(updatedYears);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed Header Section */}
      <div className="flex-none bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 space-y-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Asset Management
              {currentDepartment && ` - ${departmentLabels[currentDepartment]}`}
              {currentCategory && ` - ${categoryLabels[currentDepartment][currentCategory]}`}
            </h1>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`h-4 w-4 ml-2 transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {(isAdmin || permissionLevel === 'category') && (
                <>
                  <button
                    onClick={() => setShowImportExportModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Import/Export
                  </button>
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
              {/* Department/Category Selection with previous dept option */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(isAdmin || permissionLevel === 'viewer') && (
                  <>
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">Department</label>
                      <select
                        value={currentDepartment || ''}
                        onChange={(e) => {
                          const dept = e.target.value as AssetDepartment;
                          setCurrentDepartment(dept || null);
                          setCurrentCategory(null);
                        }}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">All Departments</option>
                        {Object.entries(departmentLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      
                      {currentDepartment && (
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id="includePrevious"
                            checked={includePreviousDepartments}
                            onChange={(e) => setIncludePreviousDepartments(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="includePrevious" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Include previous departments
                          </label>
                        </div>
                      )}
                    </div>

                    {currentDepartment && (
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">Category</label>
                        <select
                          value={currentCategory || ''}
                          onChange={(e) => setCurrentCategory(e.target.value || null)}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">All Categories</option>
                          {Object.entries(categoryLabels[currentDepartment] || {}).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Year filter types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Year Filter Type</label>
                  <select
                    value={yearFilterType}
                    onChange={handleYearFilterChange}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="single">Single Year</option>
                    <option value="multiple">Multiple Years</option>
                    <option value="range">Year Range</option>
                    <option value="before">Before Year</option>
                  </select>
                </div>
                
                {yearFilterType === 'single' && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Select Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Years</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {yearFilterType === 'multiple' && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Select Multiple Years (ctrl+click)</label>
                    <select
                      multiple
                      value={selectedYears.map(String)}
                      onChange={handleYearSelectionChange}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white h-32"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    
                    {/* Selected years tags for better UX */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedYears.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 w-full">Selected years:</p>
                      )}
                      {selectedYears.map(year => (
                        <span 
                          key={year}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                        >
                          {year}
                          <button
                            type="button"
                            className="ml-1 text-blue-600 dark:text-blue-300"
                            onClick={() => toggleYearSelection(year)}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {yearFilterType === 'range' && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Select Year Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={yearRange.start}
                        onChange={(e) => setYearRange({...yearRange, start: e.target.value})}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Start Year</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <select
                        value={yearRange.end}
                        onChange={(e) => setYearRange({...yearRange, end: e.target.value})}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select End Year</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                {yearFilterType === 'before' && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Include All Years Before</label>
                    <select
                      value={yearThreshold}
                      onChange={(e) => setYearThreshold(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year} and earlier</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Asset Summary */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Nilai Perolehan</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Rp {assetTotals.acquisitionValue.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Akumulasi Penyusutan</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Rp {assetTotals.accumulatedDepreciation.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Penyusutan Tahun Berjalan</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Rp {assetTotals.currentYearDepreciation.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Nilai Buku</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Rp {assetTotals.bookValue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable Table Section */}
      <div className="flex-grow overflow-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-full">
          <AssetTable 
            assets={filteredAssets}
            depreciationGroups={depreciationGroups}
            onEdit={handleEdit}
            onDelete={isAdmin ? (assets) => {
              assets.forEach(async (asset) => {
                if (asset.id) {
                  await deleteAsset(asset.id);
                }
              });
            } : undefined}
          />
        </div>
      </div>

      {/* Modals */}
      <AssetModal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false);
          setEditingAsset(null);
        }}
        asset={editingAsset}
      />
      
      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        assets={filteredAssets}
        onImport={handleImport}
        depreciationGroups={depreciationGroups}
      />
    </div>
  );
}