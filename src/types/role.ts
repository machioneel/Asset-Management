export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface RolePermission {
  id: string;
  role_id: string;
  department: string;
  category?: string | null;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  [department: string]: {
    [category: string]: {
      can_read: boolean;
      can_create: boolean;
      can_update: boolean;
      can_delete: boolean;
      can_export: boolean;
    };
  };
}

export type PermissionLevel = 'admin' | 'viewer' | 'department' | 'category';