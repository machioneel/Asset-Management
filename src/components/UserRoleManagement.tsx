import React, { useEffect, useState } from 'react';
import { useRoleStore } from '../store/roleStore';
import { Plus, Trash2, Save, User, UserCheck } from 'lucide-react';
import { Role, UserRole } from '../types/role';
import { supabase } from '../lib/supabase';

export default function UserRoleManagement() {
  const {
    roles,
    userRoles,
    fetchRoles,
    fetchUserRoles,
    assignRole,
    removeRole,
    isAdmin
  } = useRoleStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [userRoleAssignments, setUserRoleAssignments] = useState<{
    [key: string]: { email: string; roles: Role[] }
  }>({});

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchRoles();
        await fetchUserRoles();
        await loadUserRoleAssignments();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const loadUserRoleAssignments = async () => {
    try {
      // Get all user roles
      const { data: allUserRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role_id,
          roles:role_id(id, name, description)
        `);
      
      if (userRolesError) throw userRolesError;
      
      // Get user emails
      const userIds = [...new Set(allUserRoles.map(ur => ur.user_id))];
      const assignments: { [key: string]: { email: string; roles: Role[] } } = {};
      
      for (const userId of userIds) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();
        
        if (userError) continue;
        
        const userRoles = allUserRoles
          .filter(ur => ur.user_id === userId)
          .map(ur => ur.roles as Role);
        
        assignments[userId] = {
          email: userData.email,
          roles: userRoles
        };
      }
      
      setUserRoleAssignments(assignments);
    } catch (err) {
      console.error('Error loading user role assignments:', err);
      setError('Failed to load user assignments');
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedRole) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Find or create user
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }
      
      let userId = existingUser?.id;
      
      if (!userId) {
        // User doesn't exist, invite them
        const { data: newUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail({
          email: email,
          options: {
            redirectTo: window.location.origin
          }
        });
        
        if (inviteError) throw inviteError;
        userId = newUser?.user?.id;
        
        if (!userId) throw new Error('Failed to create user');
      }
      
      // Assign role
      await assignRole(userId, selectedRole);
      await loadUserRoleAssignments();
      
      // Reset form
      setEmail('');
      setSelectedRole(null);
    } catch (err) {
      console.error('Error assigning role:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!window.confirm('Are you sure you want to remove this role from the user?')) return;
    
    setLoading(true);
    try {
      await removeRole(userId, roleId);
      await loadUserRoleAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    } finally {
      setLoading(false);
    }
  };

  if (loading && Object.keys(userRoleAssignments).length === 0) {
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
        User Role Management
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {/* Assign Role Form */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Assign Role to User
          </h2>
          <form onSubmit={handleAssignRole} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(e.target.value || null)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign Role
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* User Role Assignments */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Current User Assignments
          </h2>
          
          {Object.entries(userRoleAssignments).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No user role assignments found.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(userRoleAssignments).map(([userId, { email, roles }]) => (
                <div key={userId} className="border rounded-lg p-4 dark:border-gray-700">
                  <div className="flex items-center mb-3">
                    <User className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">{email}</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {roles.length > 0 ? (
                      <ul className="space-y-1">
                        {roles.map((role) => (
                          <li key={role.id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {role.name}
                              {role.description && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  ({role.description})
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => handleRemoveRole(userId, role.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Remove role"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No roles assigned</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}