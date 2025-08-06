import React, { useEffect, useState } from 'react';
import { useAssetStore } from '../store/assetStore';
import { useRoleStore } from '../store/roleStore';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import {
  DeletedAsset,
  Asset,
  AssetDepartment,
  departmentLabels,
  categoryLabels
} from '../types/asset';

export default function DeletedAssets() {
  const { 
    assets, 
    loading, 
    error,
    deletedAssets,
    fetchDeletedAssets,
    depreciationGroups,
    fetchAssets
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

  // Helper function to get department label
  const getDepartmentLabel = (department: AssetDepartment): string => {
    return departmentLabels[department] || department;
  };

  // Helper function to get category label
  const getCategoryLabel = (department: AssetDepartment, category?: SecretariatCategory | EducationCategory | SocialCategory): string => {
    if (!category || !department) return '-';
    
    const departmentCategories = categoryLabels[department];
    if (!departmentCategories) return category;
    
    return departmentCategories[category] || category;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortField, setSortField] = useState<keyof DeletedAsset>('deleted_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Enhanced year filtering
  const [yearFilterType, setYearFilterType] = useState<'single' | 'range' | 'multiple' | 'before'>('single');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [yearRange, setYearRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [yearThreshold, setYearThreshold] = useState<string>('');
  
  // Enhanced department filtering
  const [includePreviousDepartments, setIncludePreviousDepartments] = useState(false);
  const [departmentOrder, setDepartmentOrder] = useState<AssetDepartment[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  useEffect(() => {
    fetchDeletedAssets();
    fetchUserRoles();
  }, [fetchDeletedAssets, fetchUserRoles]);
  
  useEffect(() => {
    // Set department order when assets are loaded
    const deptList = [...new Set(deletedAssets.map(asset => asset.department))];
    setDepartmentOrder(deptList as AssetDepartment[]);
  }, [deletedAssets]);
  
  // Extract unique years from assets
  const years = [...new Set(deletedAssets.map(asset => asset.year))].sort((a, b) => b - a);
  
  // Extract unique departments and categories
  const departments = [...new Set(deletedAssets.map(asset => asset.department))];
  const categories = [...new Set(deletedAssets.map(asset => asset.category))];

  // Format currency helper
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-';
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Sort handler
  const handleSort = (field: keyof DeletedAsset) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle filter panel
  const toggleFilterPanel = () => {
    setShowFilterPanel(!showFilterPanel);
  };

  // Reset filters
  const resetFilters = () => {
    setYearFilterType('single');
    setSelectedYear('all');
    setSelectedYears([]);
    setYearRange({ start: '', end: '' });
    setYearThreshold('');
    setCurrentDepartment(null);
    setCurrentCategory(null);
    setIncludePreviousDepartments(false);
  };

  // Filter assets based on search term and advanced filters
  const filteredAssets = deletedAssets.filter((asset) => {
    // Text search filter
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.deletion_reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Department filtering with "include previous" feature
    if (currentDepartment) {
      if (!includePreviousDepartments) {
        if (asset.department !== currentDepartment) {
          return false;
        }
      } else {
        const currentDeptIndex = departmentOrder.indexOf(currentDepartment);
        const assetDeptIndex = departmentOrder.indexOf(asset.department as AssetDepartment);
        
        // Only include if asset department is before or same as selected department in the order
        if (currentDeptIndex === -1 || assetDeptIndex === -1 || assetDeptIndex > currentDeptIndex) {
          return false;
        }
      }
    }
  
    // Category filtering
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

  // Sort assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'deleted_at' || sortField === 'acquisition_value' || sortField === 'book_value' || sortField === 'year') {
      // Numeric/date sorting
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * direction;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueA.localeCompare(valueB) * direction;
      }
      return 0;
    } else {
      // String sorting
      const valueA = String(a[sortField] || '');
      const valueB = String(b[sortField] || '');
      return valueA.localeCompare(valueB) * direction;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedAssets.length / rowsPerPage);
  const paginatedAssets = sortedAssets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Navigation handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reusable sort header component
  const SortHeader = ({ field, label }: { field: keyof DeletedAsset; label: string }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <div className="flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortDirection === 'asc' 
                ? 'text-blue-500' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 ${
              sortField === field && sortDirection === 'desc' 
                ? 'text-blue-500' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </th>
  );

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (startPage === 2) endPage = Math.min(totalPages - 1, startPage + 2);
      if (endPage === totalPages - 1) startPage = Math.max(2, endPage - 2);
      
      if (startPage > 2) {
        pages.push(-1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pages.push(-2);
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Histori Asset Dihapus
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8 flex flex-col h-[calc(100vh-160px)]">
        {/* Fixed Header Section */}
        <div className="flex-none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Search and Filter Controls */}
              <div className="flex items-center space-x-3">
                {/* Search Input */}
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama, nomor, brand, atau alasan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Filter Toggle Button */}
                <button
                  onClick={toggleFilterPanel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Filter</span>
                  {currentDepartment || currentCategory || selectedYear !== 'all' || selectedYears.length > 0 || 
                   (yearRange.start && yearRange.end) || yearThreshold ? (
                    <ChevronDown className={`h-4 w-4 ml-2 transform ${showFilterPanel ? 'rotate-180' : ''}`} />
                  ) : null}
                </button>
              </div>
              
              {/* Rows per page selector */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="rowsPerPage" className="text-sm text-gray-600 dark:text-gray-300">
                    Rows per page:
                  </label>
                  <select
                    id="rowsPerPage"
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                  </select>
                </div>
                
                {/* Page info */}
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {sortedAssets.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
                  {Math.min(currentPage * rowsPerPage, sortedAssets.length)} of {sortedAssets.length}
                </div>
              </div>
            </div>
            
            {/* Advanced Filter Panel */}
            {showFilterPanel && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4 mt-4">
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
  
                  {/* Year Filter Controls */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Year Filter Type</label>
                    <select
                      value={yearFilterType}
                      onChange={(e) => setYearFilterType(e.target.value as 'single' | 'range' | 'multiple' | 'before')}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="single">Single Year</option>
                      <option value="multiple">Multiple Years</option>
                      <option value="range">Year Range</option>
                      <option value="before">Before Year</option>
                    </select>
                  </div>
  
                  {/* Year Filter Options based on type */}
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
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Multiple Years</h3>
                      <div className="flex flex-wrap gap-2">
                        {years.map(year => (
                          <label key={year} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedYears.includes(year)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedYears([...selectedYears, year]);
                                } else {
                                  setSelectedYears(selectedYears.filter(y => y !== year));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                            />
                            <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{year}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
  
                  {yearFilterType === 'range' && (
                    <div className="flex gap-4 col-span-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Year</label>
                        <input
                          type="number"
                          value={yearRange.start}
                          onChange={(e) => setYearRange({...yearRange, start: e.target.value})}
                          placeholder="From"
                          className="w-full border border-gray-300 rounded-md text-sm p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Year</label>
                        <input
                          type="number"
                          value={yearRange.end}
                          onChange={(e) => setYearRange({...yearRange, end: e.target.value})}
                          placeholder="To"
                          className="w-full border border-gray-300 rounded-md text-sm p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
  
                  {yearFilterType === 'before' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Before Year</label>
                      <input
                        type="number"
                        value={yearThreshold}
                        onChange={(e) => setYearThreshold(e.target.value)}
                        placeholder="Assets before year"
                        className="w-full border border-gray-300 rounded-md text-sm p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
  
                {/* Filter Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="px-4 py-2 text-sm text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      
        {/* Fixed Table Header */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {[
                    { field: 'asset_number', label: 'No. Asset' },
                    { field: 'year', label: 'Tahun' },
                    { field: 'name', label: 'Nama Asset' },
                    { field: 'brand', label: 'Brand' },
                    { field: 'department', label: 'Department' },
                    { field: 'category', label: 'Category' },
                    { field: 'acquisition_value', label: 'Nilai Perolehan' },
                    { field: 'book_value', label: 'Nilai Buku' },
                    { field: 'deletion_reason', label: 'Alasan Penghapusan' },
                    { field: 'deleted_by', label: 'Dihapus Oleh' },
                    { field: 'deleted_at', label: 'Tanggal Penghapusan' }
                  ].map(({ field, label }) => (
                    <SortHeader key={field} field={field as keyof DeletedAsset} label={label} />
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Image
                  </th>
                </tr>
              </thead>
            
              {/* Scrollable Table Body */}
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedAssets.map((asset) => (
                <tr key={`${asset.id}-${asset.asset_id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {asset.asset_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {asset.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {asset.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {asset.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {getDepartmentLabel(asset.department)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {getCategoryLabel(asset.department, asset.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {formatCurrency(asset.acquisition_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {formatCurrency(asset.book_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {asset.deletion_reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {asset.deleted_by}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {formatDate(asset.deleted_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <img
                      src={asset.image_url || '/placeholder-image.png'}
                      alt={asset.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </td>
                </tr>
              ))}
  
              {/* Empty state row */}
              {paginatedAssets.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {sortedAssets.length === 0 ? (
                      <div className="flex flex-col items-center">
                        <p className="mb-2 font-medium">Tidak ada histori asset yang dihapus</p>
                        <p className="text-sm">Histori akan muncul saat Anda menghapus asset</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <p className="mb-2 font-medium">Tidak ditemukan hasil pencarian</p>
                        <p className="text-sm">Coba ubah kata kunci pencarian Anda</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
  
        {/* Fixed Footer/Pagination Section */}
        <div className="flex-none">
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous Page Button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500' 
                          : 'text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Page Numbers */}
                    {getPageNumbers().map((pageNum, index) => (
                      <React.Fragment key={index}>
                        {pageNum < 0 ? (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                            ...
                          </span>
                        ) : (
                          <button
                            onClick={() => goToPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-200'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                    
                    {/* Next Page Button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500' 
                          : 'text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
};