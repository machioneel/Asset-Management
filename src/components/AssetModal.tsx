import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Asset, AssetDepartment, departmentCodes, departmentLabels, categoryLabels } from '../types/asset';
import { useAssetStore } from '../store/assetStore';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset | null;
}

const initialFormData = {
  nfc_uid: '',
  sequential_number: '',
  asset_number: '',
  year: new Date().getFullYear(),
  name: '',
  brand: '',
  acquisition_value: 0,
  image_url: '',
  department: 'secretariat' as AssetDepartment,
  category: null as string | null,  // Changed from undefined to null
  building_code: 'A',
  asset_code: '',
  depreciation_group_id: '',
};

export default function AssetModal({ isOpen, onClose, asset }: AssetModalProps) {
  const { 
    createAsset, 
    updateAsset, 
    uploadImage,
    departments,
    buildings,
    assetCodes,
    categories,
    depreciationGroups,
    generateAssetNumber,
    fetchAssetComponents 
  } = useAssetStore();
  
  const [formData, setFormData] = useState(initialFormData);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAssetComponents();
  }, [fetchAssetComponents]);

  useEffect(() => {
    if (asset) {
      setFormData({
        ...asset,
        building_code: asset.asset_number.substring(4, 5),
        asset_code: asset.asset_number.substring(5, 8),
        sequential_number: asset.sequential_number || '',
        depreciation_group_id: asset.depreciation_group_id || ''
      });
      setImagePreview(asset.image_url);
    } else {
      setFormData({
        ...initialFormData,
        nfc_uid: generateRandomNfcUid(),
        sequential_number: '',
      });
      setSelectedImage(null);
      setImagePreview(null);
    }
  }, [asset]);

  const generateRandomNfcUid = () => {
    return Math.random().toString(16).substring(2, 10).toUpperCase();
  };

  const handleSequentialNumberChange = (value: string) => {
    // Only allow digits and limit to 4 characters
    const sanitizedValue = value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({
      ...prev, 
      sequential_number: sanitizedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      setUploading(true);
      let imageUrl = formData.image_url;
  
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }
  
      const assetNumber = await generateAssetNumber(
        departmentCodes[formData.department],
        formData.year,
        formData.building_code,
        formData.asset_code,
        formData.sequential_number
      );
  
      // Set category to null for ict and mosque_prosperity
      const category = ['ict', 'mosque_prosperity'].includes(formData.department) 
        ? null 
        : formData.category;
  
      const assetData = {
        ...formData,
        image_url: imageUrl,
        asset_number: assetNumber,
        nfc_uid: formData.nfc_uid || generateRandomNfcUid(),
        acquisition_value: Number(formData.acquisition_value) || 0,
        category: category  // Use the modified category value
      };
  
      if (asset) {
        await updateAsset(asset.id, assetData);
      } else {
        await createAsset(assetData);
      }
  
      onClose();
      setFormData(initialFormData);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error creating/updating asset:', error);
      console.log('Submitting asset data:', assetData);
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  if (!isOpen) return null;

  const departmentCategories = formData.department ? categoryLabels[formData.department] : null;
  const buildingDepreciationGroups = depreciationGroups.filter(g => g.type === 'building');
  const nonBuildingDepreciationGroups = depreciationGroups.filter(g => g.type === 'non_building');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {asset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                NFC UID
              </label>
              <input
                type="text"
                value={formData.nfc_uid}
                onChange={(e) => setFormData({ ...formData, nfc_uid: e.target.value.toUpperCase() })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Auto-generated if empty"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sequential Number (4 digits)
              </label>
              <input
                type="text"
                required
                value={formData.sequential_number}
                onChange={(e) => handleSequentialNumberChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0001"
                maxLength={4}
                pattern="\d{4}"
                title="Please enter exactly 4 digits"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    department: e.target.value as AssetDepartment,
                    category: undefined,
                  });
                }}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.entries(departmentLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            {departmentCategories && formData.department !== 'ict' && formData.department !== 'mosque_prosperity' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value || undefined })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Category</option>
                  {Object.entries(departmentCategories).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Year
              </label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Building
              </label>
              <select
                required
                value={formData.building_code}
                onChange={(e) => setFormData({ ...formData, building_code: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {buildings.map((building) => (
                  <option key={building.code} value={building.code}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Asset Code
              </label>
              <select
                required
                value={formData.asset_code}
                onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Asset Code</option>
                {assetCodes.map((code) => (
                  <option key={code.code} value={code.code}>
                    {code.code} - {code.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Brand
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Acquisition Value (Rp)
              </label>
              <input
                type="number"
                required
                value={formData.acquisition_value || 0}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  acquisition_value: Number(e.target.value) || 0 
                })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                min="0"
                step="1000"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Depreciation Group
              </label>
              <select
                required
                value={formData.depreciation_group_id}
                onChange={(e) => setFormData({ ...formData, depreciation_group_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Pilih Jenis Depresiasi</option>
                <optgroup label="Bukan Bangunan">
                  {nonBuildingDepreciationGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {(group.rate * 100).toFixed(2)}% per tahun ({group.years} tahun)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Bangunan">
                  {buildingDepreciationGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {(group.rate * 100).toFixed(2)}% per tahun ({group.years} tahun)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Image
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setFormData(initialFormData);
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Processing...' : (asset ? 'Update' : 'Add Asset')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}