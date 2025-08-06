import React, { useState, useEffect, useRef } from 'react';
import { Asset, AssetDepreciationGroup } from '../types/asset';
import { useAssetStore } from '../store/assetStore';
import { Edit, Trash2, Info, Search, ChevronUp, ChevronDown, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AssetTableProps {
  assets: Asset[];
  depreciationGroups: AssetDepreciationGroup[];
  onEdit?: (asset: Asset) => void;
  onDelete?: (assets: Asset[]) => void;
}

type SortField = 
  | 'asset_number'
  | 'year'
  | 'name'
  | 'brand'
  | 'acquisition_value'
  | 'depreciation'
  | 'book_value';

type SortDirection = 'asc' | 'desc';

export default function AssetTable({ assets, depreciationGroups, onEdit, onDelete }: AssetTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('asset_number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  // State for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteReasonType, setDeleteReasonType] = useState('');
  const [customDeleteReason, setCustomDeleteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { deleteAsset } = useAssetStore(); // Import deleteAsset from store
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
        });
      }
    };
    getUserInfo();
  }, []);
  
  // Reset to first page when search or rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  // Format currency helper
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-';
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedAssets.size === paginatedAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(paginatedAssets.map(asset => asset.id)));
    }
  };

  const toggleSelectRow = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  // Function to handle bulk delete button click
  const handleBulkDelete = () => {
    // If only one asset is selected, use the single asset delete flow
    if (selectedAssets.size === 1) {
      const assetId = Array.from(selectedAssets)[0];
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        handleDeleteClick(asset);
      }
    } else if (selectedAssets.size > 1 && onDelete) {
      // For multiple assets, use the provided onDelete handler
      const assetsToDelete = assets.filter(asset => selectedAssets.has(asset.id));
      onDelete(assetsToDelete);
      setSelectedAssets(new Set());
    }
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter assets based on search term
  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'asset_number':
        return a.asset_number.localeCompare(b.asset_number) * direction;
      case 'year':
        return (a.year - b.year) * direction;
      case 'name':
        return a.name.localeCompare(b.name) * direction;
      case 'brand':
        return a.brand.localeCompare(b.brand) * direction;
      case 'acquisition_value':
        return (a.acquisition_value - b.acquisition_value) * direction;
      case 'depreciation':
        const depGroupA = depreciationGroups.find(g => g.id === a.depreciation_group_id);
        const depGroupB = depreciationGroups.find(g => g.id === b.depreciation_group_id);
        return ((depGroupA?.rate || 0) - (depGroupB?.rate || 0)) * direction;
      case 'book_value':
        return ((a.book_value || 0) - (b.book_value || 0)) * direction;
      default:
        return 0;
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
      // Scroll table back to top when changing pages
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    }
  };

  // Function to handle delete button click
  const handleDeleteClick = (asset: Asset) => {
    setAssetToDelete(asset);
    setShowDeleteModal(true);
  };

  // Modifikasi handleConfirmDelete
  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    
    // Gunakan alasan yang sesuai berdasarkan tipe yang dipilih
    const finalDeleteReason = deleteReasonType === 'Lainnya' 
      ? customDeleteReason 
      : deleteReasonType;
      
    if (!finalDeleteReason.trim()) return;
    
    try {
      setIsSubmitting(true);
      const deletedBy = currentUser?.name || 'Admin';
      
      await deleteAsset(
        assetToDelete.id, 
        finalDeleteReason,
        deletedBy
      );
      
      setShowDeleteModal(false);
      setAssetToDelete(null);
      setDeleteReasonType('');
      setCustomDeleteReason('');
      
      const newSelected = new Set(selectedAssets);
      if (newSelected.has(assetToDelete.id)) {
        newSelected.delete(assetToDelete.id);
        setSelectedAssets(newSelected);
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable sort header component
  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
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
      // Show all pages if total pages are less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate start and end pages to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust to show correct number of pages
      if (startPage === 2) endPage = Math.min(totalPages - 1, startPage + 2);
      if (endPage === totalPages - 1) startPage = Math.max(2, endPage - 2);
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push(-1); // Use -1 to represent ellipsis
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push(-2); // Use -2 to represent ellipsis
      }
      
      // Always include last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Top Bar with Search, Rows Per Page, and Bulk Actions */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-y-2">
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari asset (nama, nomor, atau brand)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Bulk Delete Button - Only show when items are selected */}
          {selectedAssets.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Trash className="h-4 w-4" />
                <span>Delete {selectedAssets.size} rows</span>
              </button>
            </div>
          )}
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
              <option value={1000}>1000</option>
            </select>
          </div>
          
          {/* Page info */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {(currentPage - 1) * rowsPerPage + 1}-
            {Math.min(currentPage * rowsPerPage, sortedAssets.length)} of {sortedAssets.length}
          </div>
        </div>
      </div>

      {/* Table with fixed height */}
      <div 
        ref={tableContainerRef}
        className="overflow-auto flex-grow" 
        style={{ height: 'calc(100vh - 250px)' }}
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 border-r border-gray-200 dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={selectedAssets.size === paginatedAssets.length && paginatedAssets.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <SortHeader field="asset_number" label="No. Asset" />
              <SortHeader field="year" label="Tahun" />
              <SortHeader field="name" label="Nama" />
              <SortHeader field="brand" label="Brand" />
              <SortHeader field="acquisition_value" label="Nilai Perolehan" />
              <SortHeader field="depreciation" label="Depresiasi" />
              <SortHeader field="book_value" label="Nilai Buku" />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                Image
              </th>
              {onEdit && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedAssets.map((asset) => {
              const depGroup = depreciationGroups.find(g => g.id === asset.depreciation_group_id);
              
              return (
                <tr key={asset.id} className={selectedAssets.has(asset.id) ? 'bg-blue-50 dark:bg-blue-900' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.id)}
                      onChange={() => toggleSelectRow(asset.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
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
                    {formatCurrency(asset.acquisition_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {depGroup ? 
                      `${(depGroup.rate * 100).toFixed(2)}% / tahun` : 
                      '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    {formatCurrency(asset.book_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                    <img
                      src={asset.image_url}
                      alt={asset.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </td>
                  {onEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <button
                        onClick={() => onEdit(asset)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            
            {/* Empty state when no assets match filter */}
            {paginatedAssets.length === 0 && (
              <tr>
                <td 
                  colSpan={onEdit ? 10 : 9} 
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {sortedAssets.length === 0 ? (
                    <div className="flex flex-col items-center">
                      <p className="mb-2 font-medium">No assets found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <div className="animate-pulse flex flex-col items-center">
                      <p className="mb-2 font-medium">Loading assets...</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
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
                      // Render ellipsis
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                        ...
                      </span>
                    ) : (
                      // Render page number
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
      
        {/* Modal Konfirmasi Hapus */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">Konfirmasi Penghapusan Asset</h3>
              
              {assetToDelete && (
                <div className="mb-4 bg-gray-700 p-3 rounded">
                  <div className="flex items-center mb-2">
                    {assetToDelete.image_url && (
                      <img 
                        src={assetToDelete.image_url} 
                        alt={assetToDelete.name}
                        className="h-12 w-12 rounded mr-3 object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-white">{assetToDelete.name}</p>
                      <p className="text-sm text-gray-400">{assetToDelete.asset_number}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Alasan Penghapusan: <span className="text-red-400">*</span>
                </label>
                <select 
                  className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                  value={deleteReasonType}
                  onChange={(e) => {
                    setDeleteReasonType(e.target.value);
                    if (e.target.value !== 'Lainnya') {
                      setCustomDeleteReason('');
                    }
                  }}
                >
                  <option value="">Pilih alasan</option>
                  <option value="Rusak tidak dapat diperbaiki">Rusak tidak dapat diperbaiki</option>
                  <option value="Dijual">Dijual</option>
                  <option value="Hilang">Hilang</option>
                  <option value="Dihapusbukukan">Dihapusbukukan</option>
                  <option value="Disumbangkan">Disumbangkan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                
                {deleteReasonType === 'Lainnya' && (
                  <textarea
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 mt-2 text-white"
                    placeholder="Jelaskan alasan penghapusan..."
                    rows={3}
                    value={customDeleteReason}
                    onChange={(e) => setCustomDeleteReason(e.target.value)}
                  />
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAssetToDelete(null);
                    setDeleteReasonType('');
                    setCustomDeleteReason('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={!deleteReasonType || (deleteReasonType === 'Lainnya' && !customDeleteReason.trim()) || isSubmitting}
                  className={`px-4 py-2 rounded flex items-center ${
                    !deleteReasonType || (deleteReasonType === 'Lainnya' && !customDeleteReason.trim()) || isSubmitting
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isSubmitting && (
                    <span className="mr-2 animate-spin">⟳</span>
                  )}
                  Hapus Asset
                </button>
              </div>
              
              <div className="mt-4 flex items-start">
                <Info size={16} className="text-blue-400 mt-1 mr-2 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  Asset yang dihapus akan disimpan ke dalam histori penghapusan dan dapat dilihat di halaman Histori Asset Dihapus.
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}