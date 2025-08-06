import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Asset, AssetDepartment, departmentLabels, categoryLabels, departmentCodes } from '../types/asset';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onImport: (assets: Partial<Asset>[]) => Promise<void>;
  depreciationGroups: AssetDepreciationGroup[];
  refreshData: () => Promise<void>;
}

export default function ImportExportModal({ 
  isOpen, 
  onClose, 
  assets, 
  onImport, 
  depreciationGroups 
}: ImportExportModalProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<AssetDepartment | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [includeOlderYears, setIncludeOlderYears] = useState(false);
  const [mode, setMode] = useState<'import' | 'export'>('export');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState({ 
    total: 0, 
    current: 0,
    status: '' 
  });
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const years = Array.from(new Set(assets.map(asset => asset.year))).sort((a, b) => b - a);
  // Add a reverse mapping for categories
  const categoryReverseMapping: Record<AssetDepartment, Record<string, string>> = {
    secretariat: Object.entries(categoryLabels.secretariat).reduce((acc, [key, value]) => ({
      ...acc,
      [value]: key
    }), {}),
    education: Object.entries(categoryLabels.education).reduce((acc, [key, value]) => ({
      ...acc,
      [value]: key
    }), {}),
    social_affairs: Object.entries(categoryLabels.social_affairs).reduce((acc, [key, value]) => ({
      ...acc,
      [value]: key
    }), {})
  };

  const getCategories = (department: AssetDepartment) => {
    switch (department) {
      case 'secretariat':
        return categoryLabels.secretariat;
      case 'education':
        return categoryLabels.education;
      case 'social_affairs':
        return categoryLabels.social_affairs;
      default:
        return null;
    }
  };

  const handleExport = () => {
    let filteredAssets = assets;

    if (selectedDepartment !== 'all') {
      filteredAssets = filteredAssets.filter(asset => asset.department === selectedDepartment);
    }

    if (selectedCategory !== 'all') {
      filteredAssets = filteredAssets.filter(asset => asset.category === selectedCategory);
    }

    if (selectedYear !== 'all') {
      const selectedYearNum = parseInt(selectedYear);
      filteredAssets = filteredAssets.filter(asset => 
        includeOlderYears 
          ? asset.year <= selectedYearNum 
          : asset.year === selectedYearNum
      );
    }

    const exportData = filteredAssets.map(asset => {
      const depGroup = depreciationGroups.find(g => g.id === asset.depreciation_group_id);
      return {
        'Nomor Asset': asset.asset_number,
        'NFC UID': asset.nfc_uid || '-',
        'Tahun': asset.year,
        'Nama': asset.name,
        'Brand': asset.brand,
        'Nilai Perolehan': asset.acquisition_value,
        'Depresiasi': depGroup ? `${(depGroup.rate * 100).toFixed(2)}% / tahun` : '-',
        'Nilai Buku': asset.book_value,
        'Bidang': departmentLabels[asset.department],
        'Kategori': asset.category ? getCategories(asset.department)?.[asset.category] : '-',
        'Tanggal Pembelian': new Date(asset.purchase_date).toLocaleDateString('id-ID'),
        'Grup Depresiasi': depGroup?.name || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assets');
    XLSX.writeFile(wb, `assets_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    onClose();
  };

  const handlePdfExport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Asset Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    let filteredAssets = assets;
    if (selectedDepartment !== 'all') {
      filteredAssets = filteredAssets.filter(asset => asset.department === selectedDepartment);
    }
    if (selectedCategory !== 'all') {
      filteredAssets = filteredAssets.filter(asset => asset.category === selectedCategory);
    }
    if (selectedYear !== 'all') {
      const selectedYearNum = parseInt(selectedYear);
      filteredAssets = filteredAssets.filter(asset => 
        includeOlderYears 
          ? asset.year <= selectedYearNum 
          : asset.year === selectedYearNum
      );
    }

    const tableData = filteredAssets.map(asset => {
      const depGroup = depreciationGroups.find(g => g.id === asset.depreciation_group_id);
      return [
        asset.asset_number,
        asset.year.toString(),
        asset.name,
        asset.brand || 'No Brand',
        `Rp ${asset.acquisition_value.toLocaleString('id-ID')}`,
        depGroup ? `${(depGroup.rate * 100).toFixed(2)}%` : '-',
        `Rp ${asset.book_value.toLocaleString('id-ID')}`,
        departmentLabels[asset.department],
        asset.category ? getCategories(asset.department)?.[asset.category] : '-',
        depGroup?.name || '-'
      ];
    });

    doc.autoTable({
      head: [['No. Asset', 'Tahun', 'Nama', 'Brand', 'Nilai Perolehan', 'Depresiasi', 'Nilai Buku', 'Bidang', 'Kategori', 'Grup Depresiasi']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`assets_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Nomor Asset': 'ST23A0010001',
        'NFC UID': 'ABC123DE',
        'Tahun': 2023,
        'Nama': 'Laptop Dell XPS',
        'Brand': 'Dell',
        'Nilai Perolehan': 15000000,
        'Bidang': 'Sekretariat',
        'Kategori': 'Aset Tetap',
        'Grup Depresiasi': 'Kelompok 1'
      },
      {
        'Nomor Asset': 'PD23B0020002',
        'NFC UID': 'DEF456GH',
        'Tahun': 2023,
        'Nama': 'Proyektor',
        'Brand': 'Epson',
        'Nilai Perolehan': 8000000,
        'Bidang': 'Bidang Pendidikan',
        'Kategori': 'TKI',
        'Grup Depresiasi': 'Kelompok 2'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'asset_import_template.xlsx');
  };

  const parseAssetNumber = (assetNumber: string) => {
    try {
      // Remove any whitespace and ensure uppercase
      const cleanNumber = assetNumber.trim().toUpperCase();
  
      // Validate format
      if (!cleanNumber || cleanNumber.length !== 12) {
        throw new Error(`Asset number must be exactly 12 characters long (got ${cleanNumber.length})`);
      }
  
      // Extract parts
      const departmentCode = cleanNumber.substring(0, 2);
      const yearPart = cleanNumber.substring(2, 4);
      const buildingCode = cleanNumber.substring(4, 5);
      const assetCode = cleanNumber.substring(5, 8);
      const sequentialNumber = cleanNumber.substring(8);
  
      // Validate department code
      if (!Object.values(departmentCodes).includes(departmentCode)) {
        throw new Error(`Invalid department code: ${departmentCode}. Must be one of: ${Object.values(departmentCodes).join(', ')}`);
      }
  
      // Validate and determine correct century for year
      const yearNum = parseInt(yearPart, 10);
      if (isNaN(yearNum)) {
        throw new Error(`Invalid year part: ${yearPart}. Must be numeric.`);
      }
      
      // Determine the full year based on the two-digit year
      // If year is greater than current two-digit year + 10, assume it's 19xx
      // Otherwise assume it's 20xx
      const currentYear = new Date().getFullYear();
      const currentTwoDigitYear = currentYear % 100;
      const fullYear = yearNum > (currentTwoDigitYear + 10) ? 
        1900 + yearNum : 
        2000 + yearNum;
  
      // Validate building code (must be A, B, C, or D)
      if (!['A', 'B', 'C', 'D'].includes(buildingCode)) {
        throw new Error(`Invalid building code: ${buildingCode}. Must be A, B, C, or D`);
      }
  
      // Validate asset code (must be numeric and 3 digits)
      if (!/^\d{3}$/.test(assetCode)) {
        throw new Error(`Invalid asset code: ${assetCode}. Must be 3 digits`);
      }
  
      // Validate sequential number (must be numeric and 4 digits)
      if (!/^\d{4}$/.test(sequentialNumber)) {
        throw new Error(`Invalid sequential number: ${sequentialNumber}. Must be 4 digits`);
      }
  
      return {
        departmentCode,
        year: fullYear.toString(),
        buildingCode,
        assetCode,
        sequentialNumber
      };
    } catch (error) {
      throw new Error(`Invalid asset number format: ${(error as Error).message}`);
    }
  };
  
  const generateNFCUID = () => {
    // Generate 8 bytes (16 hex characters) UID
    const characters = '0123456789ABCDEF';
    let uid = '';
    for (let i = 0; i < 16; i++) {
      uid += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return uid;
  };

  // Function to check if NFC UID already exists
  const isNFCUIDUnique = (nfcUid: string, existingAssets: Asset[], currentAssets: Partial<Asset>[]) => {
    return !existingAssets.some(asset => asset.nfc_uid === nfcUid) &&
           !currentAssets.some(asset => asset.nfc_uid === nfcUid);
  };

  // Function to get a unique NFC UID
  const getUniqueNFCUID = (existingAssets: Asset[], currentAssets: Partial<Asset>[]) => {
    let nfcUid;
    do {
      nfcUid = generateNFCUID();
    } while (!isNFCUIDUnique(nfcUid, existingAssets, currentAssets));
    return nfcUid;
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
  
    try {
      setImporting(true);
      setImportProgress({ total: 0, current: 0, status: 'Reading file...' });
      
      const result = await new Promise<{ success: boolean; count: number }>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            setImportProgress(prev => ({ 
              ...prev, 
              total: jsonData.length,
              status: 'Validating data...'
            }));
  
            const validationErrors: string[] = [];
            const assetsToImport: Partial<Asset>[] = [];
  
            jsonData.forEach((row: any, index: number) => {
              try {
                setImportProgress(prev => ({ 
                  ...prev, 
                  current: index + 1,
                  status: `Validating row ${index + 1} of ${jsonData.length}...`
                }));
  
                const assetParts = parseAssetNumber(row['Nomor Asset']);
                const department = Object.entries(departmentCodes).find(
                  ([_, code]) => code === assetParts.departmentCode
                )?.[0] as AssetDepartment;
  
                if (!department) {
                  throw new Error(`Invalid department code: ${assetParts.departmentCode}`);
                }
  
                let categoryCode = null;
                if (row['Kategori'] && row['Kategori'] !== '-') {
                  categoryCode = categoryReverseMapping[department][row['Kategori']];
                  if (!categoryCode) {
                    throw new Error(
                      `Invalid category "${row['Kategori']}" for department "${departmentLabels[department]}". ` +
                      `Valid categories are: ${Object.values(categoryLabels[department]).join(', ')}`
                    );
                  }
                }
  
                if (!row['Nama']) {
                  throw new Error('Name is required');
                }
  
                if (!row['Nilai Perolehan'] || isNaN(parseFloat(row['Nilai Perolehan']))) {
                  throw new Error('Acquisition value must be a valid number');
                }
  
                const depGroup = depreciationGroups.find(g => g.name === row['Grup Depresiasi']);
                if (!depGroup) {
                  throw new Error(`Invalid depreciation group: ${row['Grup Depresiasi']}`);
                }

                // Generate NFC UID if it's empty or "-"
                const nfcUid = (!row['NFC UID'] || row['NFC UID'] === '-') 
                  ? getUniqueNFCUID(assets, assetsToImport)
                  : row['NFC UID'];
  
                assetsToImport.push({
                  asset_number: row['Nomor Asset'],
                  nfc_uid: nfcUid,
                  year: parseInt(assetParts.year),
                  name: row['Nama'],
                  brand: row['Brand'] || 'No Brand',
                  acquisition_value: parseFloat(row['Nilai Perolehan']),
                  department,
                  category: categoryCode,
                  building_code: assetParts.buildingCode,
                  asset_code: assetParts.assetCode,
                  sequential_number: assetParts.sequentialNumber,
                  depreciation_group_id: depGroup.id,
                  purchase_date: new Date().toISOString(),
                });
              } catch (error) {
                validationErrors.push(`Row ${index + 1}: ${(error as Error).message}`);
              }
            });
  
            if (validationErrors.length > 0) {
              throw new Error('Validation errors:\n' + validationErrors.join('\n'));
            }

            await onImport(assetsToImport);
            await refreshData();
            
            resolve({ success: true, count: assetsToImport.length });
          } catch (error) {
            reject(error);
          }
        };
  
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      });
  
      if (result.success) {
        showNotification('success', `Successfully imported ${result.count} assets`);
        onClose();
      }
    } catch (error) {
      console.error('Error processing import:', error);
      showNotification('error', (error as Error).message);
    } finally {
      setImporting(false);
      setImportProgress({ total: 0, current: 0, status: '' });
    }
  };

  const handleImportAssets = async (assets: Partial<Asset>[]) => {
    try {
      // Disable any auto-refresh atau polling sementara
      setAutoRefresh(false);
      
      // Panggil API untuk batch import
      await api.assets.batchImport(assets);
      
      // Refresh data sekali setelah semua selesai
      await fetchAssets();
    } finally {
      // Aktifkan kembali auto-refresh jika ada
      setAutoRefresh(true);
    }
  };

  // Render notification
  const renderNotification = () => {
    if (!notification.show) return null;

    return (
      <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 z-50 ${
        notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {notification.type === 'success' ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <XCircle className="h-5 w-5" />
        )}
        <span>{notification.message}</span>
      </div>
    );
  };
  
  if (!isOpen) return null;

  return (
    <>{renderNotification()}
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'export' ? 'Export Assets' : 'Import Assets'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Format Info */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Format File yang Didukung
                </h4>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p className="mb-2">Format file yang dapat digunakan:</p>
                  <ul className="list-disc list-inside mb-4">
                    <li>Microsoft Excel (.xlsx)</li>
                    <li>Excel 97-2004 Workbook (.xls)</li>
                  </ul>
                  
                  <p className="mb-2">Kolom yang diperlukan untuk import:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Nomor Asset (text) - Format: BBYYGSSSNNNN</li>
                    <li>NFC UID (text) - Opsional</li>
                    <li>Tahun (number) - Wajib</li>
                    <li>Nama (text) - Wajib</li>
                    <li>Brand (text) - Opsional</li>
                    <li>Nilai Perolehan (number) - Wajib</li>
                    <li>Bidang (text) - Wajib</li>
                    <li>Kategori (text) - Opsional</li>
                    <li>Grup Depresiasi (text) - Wajib</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setMode('export')}
              className={`px-4 py-2 rounded-md ${
                mode === 'export'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Export
            </button>
            <button
              onClick={() => setMode('import')}
              className={`px-4 py-2 rounded-md ${
                mode === 'import'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Import
            </button>
          </div>

          <form onSubmit={handleImport} className="space-y-4">
            {mode === 'export' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bidang
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => {
                      const dept = e.target.value as AssetDepartment | 'all';
                      setSelectedDepartment(dept);
                      setSelectedCategory('all');
                    }}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Semua Bidang</option>
                    {Object.entries(departmentLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDepartment !== 'all' && getCategories(selectedDepartment as AssetDepartment) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kategori
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Semua Kategori</option>
                      {Object.entries(getCategories(selectedDepartment as AssetDepartment) || {}).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tahun
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Semua Tahun</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedYear !== 'all' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeOlderYears"
                      checked={includeOlderYears}
                      onChange={(e) => setIncludeOlderYears(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label
                      htmlFor="includeOlderYears"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Sertakan tahun-tahun sebelumnya
                    </label>
                  </div>
                )}
              </div>
            )}

            {mode === 'import' && (
              <div>
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    Download Template Excel
                  </button>
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File Excel
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-blue-900 dark:file:text-blue-200
                    dark:file:hover:bg-blue-800"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Batal
              </button>
              {mode === 'export' ? (
                <>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={handlePdfExport}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Export PDF
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={!file || importing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
      </>
  );
}