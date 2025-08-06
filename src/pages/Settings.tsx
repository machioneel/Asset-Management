import React, { useEffect, useState } from 'react';
import { useRoleStore } from '../store/roleStore';
import { Plus, Trash2, Save } from 'lucide-react';
import { Role, RolePermission } from '../types/role';
import { departmentLabels } from '../types/asset';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const {
    roles,
    rolePermissions,
    loading,
    error,
    isAdmin,
    fetchRoles,
    fetchRolePermissions,
    createRole,
    deleteRole,
    updateRolePermissions,
  } = useRoleStore();

  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (!roles.length) await fetchRoles();
        if (!rolePermissions.length) await fetchRolePermissions();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        // Remove set({ loading: false }) as the store methods handle loading state
      }
    };
    initializeData();
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    if (selectedRole) {
      const rolePerms = rolePermissions.filter(p => p.role_id === selectedRole.id);
      if (rolePerms.length === 0) {
        // Initialize permissions for all departments
        const initialPerms = Object.keys(departmentLabels).map(dept => ({
          role_id: selectedRole.id,
          department: dept,
          can_read: false,
          can_create: false,
          can_update: false,
          can_delete: false,
          can_export: false,
        }));
        setPermissions(initialPerms);
      } else {
        setPermissions(rolePerms);
      }
    }
  }, [selectedRole, rolePermissions]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name) return;
    
    try {
      await createRole(newRole);
      setNewRole({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.name === 'admin') {
      alert('Cannot delete admin role');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        await deleteRole(role.id);
        setSelectedRole(null);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const handlePermissionChange = (department: string, permission: keyof Omit<RolePermission, 'id' | 'role_id' | 'department' | 'created_at' | 'updated_at'>) => {
    setPermissions(perms =>
      perms.map(p =>
        p.department === department
          ? { ...p, [permission]: !p[permission] }
          : p
      )
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      await updateRolePermissions(selectedRole.id, permissions);
      alert('Permissions saved successfully');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error saving permissions');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Role Management
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {/* Create New Role */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Create New Role
          </h2>
          <form onSubmit={handleCreateRole} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </button>
            </div>
          </form>
        </div>

        {/* Role List */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Existing Roles
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`p-4 rounded-lg border ${
                  selectedRole?.id === role.id
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {role.description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit Permissions
                    </button>
                    {role.name !== 'admin' && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Management */}
        {selectedRole && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Permissions for {selectedRole.name}
              </h3>
              <button
                onClick={handleSavePermissions}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Permissions
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Read
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Create
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Update
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Delete
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Export
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {permissions.map((permission) => (
                    <tr key={permission.department}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {departmentLabels[permission.department as keyof typeof departmentLabels]}
                      </td>
                      {['read', 'create', 'update', 'delete', 'export'].map((perm) => (
                        <td key={perm} className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={permission[`can_${perm}` as keyof RolePermission] as boolean}
                            onChange={() => handlePermissionChange(permission.department, `can_${perm}` as keyof RolePermission)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}