// store/roleStore.ts

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Role, UserRole, RolePermission, UserPermissions, PermissionLevel } from '../types/role';
import { AssetDepartment } from '../types/asset';

interface RoleStore {
    roles: Role[];
    userRoles: UserRole[];
    rolePermissions: RolePermission[];
    userPermissions: UserPermissions;
    permissionLevel: PermissionLevel;
    loading: boolean;
    error: string | null;
    isAdmin: boolean;
    set: (updates: Partial<RoleStore>) => void
    currentDepartment: AssetDepartment | null;
    currentCategory: string | null;
    
    fetchRoles: () => Promise<void>;
    fetchUserRoles: () => Promise<void>;
    fetchRolePermissions: () => Promise<void>;
    createRole: (role: Partial<Role>) => Promise<void>;
    updateRole: (id: string, role: Partial<Role>) => Promise<void>;
    deleteRole: (id: string) => Promise<void>;
    assignRole: (userId: string, roleId: string) => Promise<void>;
    removeRole: (userId: string, roleId: string) => Promise<void>;
    updateRolePermissions: (roleId: string, permissions: Partial<RolePermission>[]) => Promise<void>;
    hasPermission: (department: string, category: string | null, permission: 'read' | 'create' | 'update' | 'delete' | 'export') => boolean;
    setCurrentDepartment: (department: AssetDepartment | null) => void;
    setCurrentCategory: (category: string | null) => void;
}

export const useRoleStore = create<RoleStore>((set, get) => ({
    roles: [],
    userRoles: [],
    rolePermissions: [],
    userPermissions: {},
    permissionLevel: 'viewer',
    loading: false,
    error: null,
    isAdmin: false,
    set: (updates) => set(updates),
    currentDepartment: null,
    currentCategory: null,

    setCurrentDepartment: (department) => set({ currentDepartment: department }),
    setCurrentCategory: (category) => set({ currentCategory: category }),

    fetchUserRoles: async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: permissionsData, error: permissionsError } = await supabase
      .rpc('get_user_permissions', { p_user_id: user?.id });
    
    console.log('User Permissions:', permissionsData, permissionsError);

    set({ 
      isAdmin: true, 
      permissionLevel: 'admin',
      userPermissions: permissionsData || {}
    });
  } catch (error) {
    console.error('Permissions fetch failed:', error);
  }
},
    

    fetchRoles: async () => {
      try {
        set({ loading: true, error: null });
        
        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
    
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        set({ 
          roles: data || [],
          loading: false
        });
      } catch (error) {
        console.error('Full roles fetch error:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },
    
    fetchRolePermissions: async () => {
      try {
        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
    
        const { data, error } = await supabase
          .from('role_permissions')
          .select('*');
        
        if (error) throw error;
        
        set({ 
          rolePermissions: data || [],
          loading: false
        });
      } catch (error) {
        console.error('Full role permissions fetch error:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },
  
    createRole: async (role) => {
      try {
        const { data, error } = await supabase.from('roles').insert([role]).select();
        
        if (error) throw error;
        
        set(state => ({ roles: [...state.roles, ...(data || [])] }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
  
    deleteRole: async (id) => {
      try {
        const { error } = await supabase.from('roles').delete().eq('id', id);
        
        if (error) throw error;
        
        set(state => ({ roles: state.roles.filter(role => role.id !== id) }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
  
    updateRolePermissions: async (roleId, permissions) => {
      try {
        // Delete existing permissions
        await supabase.from('role_permissions').delete().eq('role_id', roleId);
        
        // Insert new permissions
        const { data, error } = await supabase.from('role_permissions').insert(permissions).select();
        
        if (error) throw error;
        
        set(state => ({
          rolePermissions: [
            ...state.rolePermissions.filter(p => p.role_id !== roleId),
            ...(data || [])
          ]
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    hasPermission: (department, category, permission) => {
      const { isAdmin, userPermissions } = get();
      
      console.log('Checking Permission:', {
        isAdmin, 
        department, 
        category, 
        permission,
        userPermissions
      });
      
      if (isAdmin) return true;
      
      const deptPerms = userPermissions[department];
      if (!deptPerms) return false;
      
      if (category) {
        return deptPerms[category]?.[`can_${permission}`] || false;
      }
      
      return deptPerms['_department']?.[`can_${permission}`] || false;
    },
}));