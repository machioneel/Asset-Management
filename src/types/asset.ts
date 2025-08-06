export type SecretariatCategory = 'fixed' | 'inventory';
export type EducationCategory = 'tki' | 'sdi' | 'tpa' | 'madrasah';
export type SocialCategory = 'ayd' | 'youth' | 'muamalah';
export type AssetDepartment = 'secretariat' | 'mosque_prosperity' | 'education' | 'social_affairs' | 'ict';

export interface AssetDepartmentCode {
  code: string;
  name: string;
  description: string;
}

// Tambahkan di file types/asset.ts

export interface DeletedAsset {
  id: string;
  asset_id: string;
  name: string;
  asset_number: string;
  nfc_uid?: string;
  department: AssetDepartment;
  category?: SecretariatCategory | EducationCategory | SocialCategory;
  acquisition_value: number;
  book_value: number;
  year?: number;
  condition?: string;
  location?: string;
  description?: string;
  image_url?: string;
  purchase_date?: string;
  depreciation_group?: string;
  deleted_at: string;
  deleted_by: string;
  deletion_reason: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssetBuilding {
  code: string;
  name: string;
  description: string;
}

export interface AssetCode {
  code: string;
  name: string;
  description: string;
}

export interface Category {
  id: string;
  department: string;
  code: string;
  name: string;
}

export interface AssetDepreciationGroup {
  id: string;
  code: string;
  name: string;
  type: 'building' | 'non_building';
  years: number;
  rate: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  nfc_uid: string;
  asset_number: string;
  sequential_number: string;
  year: number;
  name: string;
  brand: string;
  acquisition_value: number;
  depreciation_rate: number;
  purchase_date: string;
  book_value: number;
  image_url: string;
  department: AssetDepartment;
  category?: SecretariatCategory | EducationCategory | SocialCategory;
  depreciation_group?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetScanHistory {
  id: string;
  asset_id: string;
  asset: Asset;
  scanned_at: string;
}

export const departmentLabels: Record<AssetDepartment, string> = {
  secretariat: 'Sekretariat',
  mosque_prosperity: 'Bidang Kemakmuran Masjid',
  education: 'Bidang Pendidikan',
  social_affairs: 'Bidang Sosial Kemasyarakatan',
  ict: 'Bidang ICT',
};

export const departmentCodes: Record<AssetDepartment, string> = {
  secretariat: 'ST',
  mosque_prosperity: 'KM',
  education: 'PD',
  social_affairs: 'SK',
  ict: 'IT',
};

export const categoryLabels = {
  secretariat: {
    fixed: 'Aset Tetap',
    inventory: 'Inventaris Aset',
  },
  education: {
    tki: 'TKI',
    sdi: 'SDI',
    tpa: 'TPA',
    madrasah: 'Madrasah',
  },
  social_affairs: {
    ayd: 'Seksi AYD',
    youth: 'Seksi Remaja',
    muamalah: 'Seksi Muamalah dan Kematian',
  },
};