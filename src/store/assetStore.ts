import { create } from 'zustand';
import { Asset, AssetDepartment, AssetScanHistory, AssetDepartmentCode, AssetBuilding, AssetCode, Category } from '../types/asset';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Interface untuk asset yang dihapus
export interface DeletedAsset {
  id: string;
  asset_id: string;
  name: string;
  asset_number: string;
  departments: AssetDepartment[];
  acquisition_value: number;
  book_value: number;
  condition?: string;
  image_url?: string;
  deleted_at: string;
  deleted_by: string;
  deletion_reason: string;
  year?: number;
  categories?: Category[];
}

interface AssetStore {
  assets: Asset[];
  deletedAssets: DeletedAsset[];
  departments: AssetDepartmentCode[];
  buildings: AssetBuilding[];
  assetCodes: AssetCode[];
  categories: Category[];
  scanHistory: AssetScanHistory[];
  loading: boolean;
  error: string | null;
  stats: {
    totalAssets: number;
    totalValue: number;
    activeNfcTags: number;
    departmentCounts: Record<AssetDepartment, number>;
  };
  depreciationGroups: AssetDepreciationGroup[];
  fetchAssets: () => Promise<void>;
  fetchDeletedAssets: () => Promise<void>;
  fetchAssetComponents: () => Promise<void>;
  fetchScanHistory: () => Promise<void>;
  fetchDepreciationGroups: () => Promise<void>;
  getAssetByNfcUid: (uid: string) => Promise<Asset | null>;
  createAsset: (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'book_value'>) => Promise<void>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string, reason: string, deletedBy: string) => Promise<void>;
  clearScanHistory: (id?: string) => Promise<void>;
  calculateBookValue: (asset: Asset) => number;
  calculateStats: () => void;
  uploadImage: (file: File) => Promise<string>;
  generateAssetNumber: (
    departmentCode: string,
    year: number,
    buildingCode: string,
    assetCode: string,
    sequentialNumber: string
  ) => Promise<string>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  deletedAssets: [],
  department: [],
  buildings: [],
  assetCodes: [],
  category: [],
  scanHistory: [],
  depreciationGroups: [],
  loading: false,
  error: null,
  stats: {
    totalAssets: 0,
    totalValue: 0,
    activeNfcTags: 0,
    departmentCounts: {
      secretariat: 0,
      mosque_prosperity: 0,
      education: 0,
      social_affairs: 0,
      ict: 0,
    },
  },

  // Fungsi baru untuk mendapatkan asset yang sudah dihapus
  fetchDeletedAssets: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('deleted_assets')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      set({ deletedAssets: data as DeletedAsset[], error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchAssetComponents: async () => {
    try {
      const [deptResponse, buildingResponse, codesResponse, categoriesResponse, depGroupsResponse] = await Promise.all([
        supabase.from('asset_departments').select('*'),
        supabase.from('asset_buildings').select('*'),
        supabase.from('asset_codes').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('asset_depreciation_groups').select('*')
      ]);

      if (deptResponse.error) throw deptResponse.error;
      if (buildingResponse.error) throw buildingResponse.error;
      if (codesResponse.error) throw codesResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      set({
        departments: deptResponse.data,
        buildings: buildingResponse.data,
        assetCodes: codesResponse.data,
        categories: categoriesResponse.data,
        depreciationGroups: depGroupsResponse.data
      });
    } catch (error) {
      console.error('Error fetching asset components:', error);
      set({ error: (error as Error).message });
    }
  },

  generateAssetNumber: async (departmentCode, year, buildingCode, assetCode, sequentialNumber) => {
    // Ensure sequential number is padded to 4 digits
    const paddedSequential = sequentialNumber.padStart(4, '0');
    // Get last 2 digits of year
    const yearStr = year.toString().slice(-2);
    // Ensure asset code is padded to 3 digits
    const paddedAssetCode = assetCode.padStart(3, '0');
    
    // Format: BBYYGSSSNNNN
    return `${departmentCode}${yearStr}${buildingCode}${paddedAssetCode}${paddedSequential}`;
  },

  uploadImage: async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('asset-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('asset-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  fetchAssets: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ assets: data as Asset[], error: null });
      get().calculateStats();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchDepreciationGroups: async () => {
    try {
      const { data, error } = await supabase
        .from('asset_depreciation_groups')
        .select('*')
        .order('type', { ascending: true })
        .order('years', { ascending: true });

      if (error) throw error;
      set({ depreciationGroups: data });
    } catch (error) {
      console.error('Error fetching depreciation groups:', error);
    }
  },

  calculateBookValue: (asset: Asset) => {
    if (!asset.depreciation_group) return asset.acquisition_value;

    const depGroup = get().depreciationGroups.find(g => g.code === asset.depreciation_group);
    if (!depGroup) return asset.acquisition_value;

    const currentYear = new Date().getFullYear();
    const ageInYears = currentYear - asset.year;
    const totalDepreciation = asset.acquisition_value * depGroup.rate * ageInYears;
    const calculatedValue = asset.acquisition_value - totalDepreciation;
    
    // Return 1 rupiah if the asset is fully depreciated, otherwise return the calculated value
    return Math.max(calculatedValue, 1);
  },

  fetchScanHistory: async () => {
    try {
      const { data: scanData, error: scanError } = await supabase
        .from('asset_scan_history')
        .select(`
          id,
          asset_id,
          scanned_at,
          assets (
            id,
            name,
            image_url
          )
        `)
        .order('scanned_at', { ascending: false });

      if (scanError) throw scanError;

      const formattedHistory = scanData.map(scan => ({
        id: scan.id,
        asset_id: scan.asset_id,
        scanned_at: scan.scanned_at,
        asset: scan.assets
      }));

      set({ scanHistory: formattedHistory as AssetScanHistory[] });
    } catch (error) {
        console.error('Error fetching scan history:', error);
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
        }
        console.error('Environment:', window.location.hostname);
      }
  },

  getAssetByNfcUid: async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('nfc_uid', uid)
        .single();

      if (error) throw error;
      
      // Create scan history entry
      await supabase
        .from('asset_scan_history')
        .insert([{ asset_id: data.id }]);
      
      get().fetchScanHistory();
      
      return data as Asset;
    } catch (error) {
      console.error('Error fetching asset by NFC UID:', error);
      return null;
    }
  },

  createAsset: async (asset) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert([{
          ...asset,
          purchase_date: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      await get().fetchAssets();
      return data;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  },

  updateAsset: async (id, asset) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({
          ...asset,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await get().fetchAssets();
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  },

  // Modifikasi fungsi deleteAsset untuk menyimpan histori penghapusan
  deleteAsset: async (id: string, reason: string, deletedBy: string): Promise<void> => {
    set({ loading: true });
    try {
      // First, get the asset to be deleted
      const asset = get().assets.find(a => a.id === id);
      if (!asset) throw new Error('Asset not found');
  
      // Set up the deleted asset object with all required fields
      const deletedAsset = {
        //id: uuidv4(), // Generate a new ID for the deleted_assets record
        asset_id: asset.id,
        name: asset.name,
        asset_number: asset.asset_number,
        department: asset.department || 'secretariat' as AssetDepartment, // Use default department if null
        acquisition_value: asset.acquisition_value,
        book_value: asset.book_value || 0,
        condition: asset.condition,
        image_url: asset.image_url,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        deletion_reason: reason,
        year: asset.year,
        category: asset.category,
        brand: asset.brand
      };
  
      // Insert into deleted_assets
      const { error: insertError } = await supabase
        .from('deleted_assets')
        .insert(deletedAsset);
      
      if (insertError) throw insertError;
  
      // Delete from assets table
      const { error: deleteError } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
  
      // Update local state
      set(state => ({
        assets: state.assets.filter(a => a.id !== id),
        deletedAssets: [deletedAsset, ...state.deletedAssets],
        error: null
      }));
  
      // Recalculate stats
      get().calculateStats();
      
    } catch (error) {
      console.error('Error deleting asset:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  clearScanHistory: async (id?: string) => {
    try {
      let query = supabase
        .from('asset_scan_history')
        .delete();
      
      if (id) {
        query = query.eq('id', id);
      }

      const { error } = await query;
      if (error) throw error;
      await get().fetchScanHistory();
    } catch (error) {
      console.error('Error clearing scan history:', error);
    }
  },

  calculateStats: () => {
    const assets = get().assets;
    const stats = {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + asset.acquisition_value, 0),
      activeNfcTags: new Set(assets.map(asset => asset.nfc_uid)).size,
      departmentCounts: {
        secretariat: 0,
        mosque_prosperity: 0,
        education: 0,
        social_affairs: 0,
        ict: 0,
      } as Record<AssetDepartment, number>,
    };

    assets.forEach(asset => {
      stats.departmentCounts[asset.department]++;
    });

    set({ stats });
  },
}));