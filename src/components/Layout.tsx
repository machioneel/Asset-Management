import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, HelpCircle, Box, Trash2, Settings, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useRoleStore } from '../store/roleStore';
import UserMenu from './UserMenu';

export default function Layout() {
    const { isDarkMode, toggleTheme } = useThemeStore();
    const { 
        isAdmin, 
        permissionLevel,
        fetchUserRoles,
        loading,
        error
    } = useRoleStore();

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();

    // Fetch user roles on mount
    useEffect(() => {
        fetchUserRoles();
    }, [fetchUserRoles]);

    // Handle theme changes
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-red-600">Error: {error}</div>
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Assets', href: '/assets', icon: Box },
        { name: 'Deleted Assets', href: '/deletedasset', icon: Trash2 },
        { name: 'User Guide', href: '/userguide', icon: HelpCircle },
    ];

    // Only show Settings for admin
    if (isAdmin) {
        navigation.push({ name: 'Settings', href: '/settings', icon: Settings });
    }

    const toggleSidebar = () => setIsExpanded(!isExpanded);
    const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Floating Sidebar */}
      <div 
        className={`
          fixed left-4 top-4 bottom-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg
          transition-all duration-300 ease-in-out z-50
          ${isExpanded ? 'w-64' : 'w-16'}
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {isExpanded && (
              <span className="text-md font-bold text-gray-800 dark:text-white truncate">
                Yayasan As-Salam Joglo
              </span>
            )}
            <button 
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleMobileSidebar();
                } else {
                  toggleSidebar();
                }
              }}
            >
              {isExpanded ? (
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => window.innerWidth < 768 && toggleMobileSidebar()}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 mb-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {isExpanded && <span className="ml-3">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 dark:border-gray-700">
            {/* Theme Toggle Button */}
            <div className="p-4">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-800 dark:text-gray-300" />
                )}
                {isExpanded && (
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                )}
              </button>
            </div>

            {/* User Menu */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="p-2">
                <UserMenu isExpanded={isExpanded} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <button
        className="fixed top-4 left-4 md:hidden z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
        onClick={toggleMobileSidebar}
      >
        <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Main content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'md:ml-72' : 'md:ml-24'}`}>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}