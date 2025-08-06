import React, { useEffect, useState, useMemo } from 'react';
import { useAssetStore } from '../store/assetStore';
import { Plus, FileDown, Filter } from 'lucide-react';
import { Trash2, ChevronRight } from 'lucide-react';
import { Asset, AssetDepartment, departmentLabels, categoryLabels } from '../types/asset';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  stats: { label: string; value: string | number | JSX.Element }[];
}

function StatsModal({ isOpen, onClose, title, stats }: StatsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stats.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                <div className="text-gray-900 dark:text-white">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { assets, scanHistory, loading, error, fetchAssets, fetchScanHistory, clearScanHistory } = useAssetStore();
  const [selectedDepartment, setSelectedDepartment] = useState<AssetDepartment | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [statsModal, setStatsModal] = useState<{
    isOpen: boolean;
    title: string;
    stats: { label: string; value: string | number }[];
  }>({
    isOpen: false,
    title: '',
    stats: [],
  });

  const years = useMemo(() => {
    const uniqueYears = [...new Set(assets.map(asset => asset.year))];
    return uniqueYears.sort((a, b) => b - a);
  }, [assets]);

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

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesDepartment = selectedDepartment === 'all' || asset.department === selectedDepartment;
      const matchesCategory =
        selectedCategory === 'all' ||
        (asset.department === selectedDepartment && asset.category === selectedCategory);
      const matchesYear = selectedYear === 'all' || asset.year.toString() === selectedYear;

      return matchesDepartment && matchesCategory && matchesYear;
    });
  }, [assets, selectedDepartment, selectedCategory, selectedYear]);

  const calculateStatsByGroup = (assets: Asset[]) => {
    return assets.reduce((acc, asset) => {
      const key = selectedDepartment === 'all' ? asset.department : asset.category || 'uncategorized';
      const label = selectedDepartment === 'all'
        ? departmentLabels[asset.department as AssetDepartment]
        : getCategories(selectedDepartment as AssetDepartment)?.[key as keyof typeof categoryLabels.secretariat] || 'Uncategorized';
      
      if (!acc[key]) {
        acc[key] = {
          label,
          count: 0,
          acquisitionValue: 0,
          bookValue: 0,
          nfcCount: 0,
        };
      }
      
      acc[key].count++;
      acc[key].acquisitionValue += asset.acquisition_value;
      acc[key].bookValue += asset.book_value;
      if (asset.nfc_uid) acc[key].nfcCount++;
      
      return acc;
    }, {} as Record<string, { 
      label: string; 
      count: number; 
      acquisitionValue: number; 
      bookValue: number; 
      nfcCount: number 
    }>);
  };

  const dashboardStats = useMemo(() => {
    const totalAcquisitionValue = filteredAssets.reduce((sum, asset) => sum + asset.acquisition_value, 0);
    const totalBookValue = filteredAssets.reduce((sum, asset) => sum + asset.book_value, 0);
    const activeNfcTags = filteredAssets.filter(asset => asset.nfc_uid).length;
    const groupStats = calculateStatsByGroup(filteredAssets);
    
    return {
      totalAssets: filteredAssets.length,
      totalAcquisitionValue,
      totalBookValue,
      activeNfcTags,
      groupStats,
    };
  }, [filteredAssets]);

  const valueTrends = useMemo(() => {
    // Sort assets by year
    const sortedAssets = [...filteredAssets].sort((a, b) => a.year - b.year);
    
    // Calculate cumulative values by year
    const yearlyData = sortedAssets.reduce((acc, asset) => {
      const year = asset.year;
      if (!acc[year]) {
        // Get previous year's values or start at 0
        const prevYear = Math.max(...Object.keys(acc).map(Number), 0);
        acc[year] = {
          acquisitionValue: prevYear ? acc[prevYear].acquisitionValue : 0,
          bookValue: prevYear ? acc[prevYear].bookValue : 0
        };
      }
      // Add this year's values to the cumulative total
      acc[year].acquisitionValue += asset.acquisition_value;
      acc[year].bookValue += asset.book_value;
      
      return acc;
    }, {} as Record<number, { acquisitionValue: number; bookValue: number }>);

    const years = Object.keys(yearlyData).sort();
    
    return {
      labels: years,
      datasets: [
        {
          label: 'Nilai Perolehan (Kumulatif)',
          data: years.map(year => yearlyData[year].acquisitionValue),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
        {
          label: 'Nilai Buku (Kumulatif)',
          data: years.map(year => yearlyData[year].bookValue),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
        }
      ]
    };
  }, [filteredAssets]);

  useEffect(() => {
    fetchAssets();
    fetchScanHistory();
    const interval = setInterval(fetchScanHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchAssets, fetchScanHistory]);

  const handleStatsClick = (type: string) => {
    const groupStats = dashboardStats.groupStats;
    let title = '';
    let stats: { label: string; value: string | number }[] = [];

    switch (type) {
      case 'total':
        title = selectedDepartment === 'all' ? 'Jumlah Asset per Bidang' : 'Jumlah Asset per Kategori';
        stats = Object.values(groupStats).map(({ label, count }) => ({
          label,
          value: count,
        }));
        break;
      case 'value':
        title = selectedDepartment === 'all' ? 'Nilai Asset per Bidang' : 'Nilai Asset per Kategori';
        stats = Object.values(groupStats).map(({ label, acquisitionValue, bookValue }) => ({
          label,
          value: (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Perolehan:</span>
                <span className="font-medium">Rp {acquisitionValue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Buku:</span>
                <span className="font-medium">Rp {bookValue.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ),
        }));
        break;
      case 'nfc':
        title = selectedDepartment === 'all' ? 'Tag NFC Aktif per Bidang' : 'Tag NFC Aktif per Kategori';
        stats = Object.values(groupStats).map(({ label, nfcCount }) => ({
          label,
          value: nfcCount,
        }));
        break;
      case 'department':
        title = selectedDepartment === 'all' ? 'Daftar Bidang' : 'Daftar Kategori';
        stats = Object.values(groupStats).map(({ label }) => ({
          label,
          value: '-',
        }));
        break;
    }

    setStatsModal({
      isOpen: true,
      title,
      stats,
    });
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>

        {(selectedDepartment !== 'all' || selectedCategory !== 'all' || selectedYear !== 'all') && (
          <button 
            onClick={() => {
              setSelectedDepartment('all');
              setSelectedCategory('all');
              setSelectedYear('all');
            }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Clear Filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={selectedDepartment}
              onChange={(e) => {
                const department = e.target.value as AssetDepartment | 'all';
                setSelectedDepartment(department);
                setSelectedCategory('all');
              }}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">Semua Bidang</option>
              {Object.entries(departmentLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {selectedDepartment !== 'all' && getCategories(selectedDepartment as AssetDepartment) && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">Semua Kategori</option>
                {Object.entries(getCategories(selectedDepartment as AssetDepartment) || {}).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            )}

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">Semua Tahun</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleStatsClick('total')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Jumlah Total Aset</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {dashboardStats.totalAssets}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </button>
        
        <button
          onClick={() => handleStatsClick('value')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Nilai Perolehan</h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Rp {dashboardStats.totalAcquisitionValue.toLocaleString('id-ID')}
                </p>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Nilai Buku</h3>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  Rp {dashboardStats.totalBookValue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </button>
        
        <button
          onClick={() => handleStatsClick('nfc')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tag NFC Aktif</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {dashboardStats.activeNfcTags}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </button>
        
        <button
          onClick={() => handleStatsClick('department')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {selectedDepartment === 'all' ? 'Total Bidang' : 'Total Kategori'}
              </h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {Object.keys(dashboardStats.groupStats).length}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {selectedDepartment === 'all' ? 'Bidang' : 'Kategori'}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(dashboardStats.groupStats).map(({ label, count, acquisitionValue, bookValue }) => (
            <div key={label} className="border dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {label}
              </h3>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{count}</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nilai Perolehan: Rp {acquisitionValue.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nilai Buku: Rp {bookValue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Tren Nilai Asset (Kumulatif)
          </h2>
        </div>
        <div className="h-[300px]">
          <Line
            data={valueTrends}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `Rp ${Number(value).toLocaleString('id-ID')}`
                  }
                }
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
                  }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw as number;
                      return `${context.dataset.label}: Rp ${value.toLocaleString('id-ID')}`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Aktivitas Terbaru</h2>
          <button
            onClick={() => clearScanHistory()}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          {scanHistory.map((scan) => (
            <div
              key={scan.id}
              className="flex items-center justify-between border-b dark:border-gray-700 pb-4"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={scan.asset.image_url}
                  alt={scan.asset.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{scan.asset.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(scan.scanned_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => clearScanHistory(scan.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {scanHistory.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada aktivitas terbaru</p>
          )}
        </div>
      </div>

      <StatsModal
        isOpen={statsModal.isOpen}
        onClose={() => setStatsModal({ ...statsModal, isOpen: false })}
        title={statsModal.title}
        stats={statsModal.stats}
      />
    </div>
  );
}