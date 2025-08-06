import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserMenuProps {
  isExpanded: boolean;
}

export default function UserMenu({ isExpanded }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    email?: string;
    name?: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserInfo({
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
        });
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
        {isExpanded && userInfo && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {userInfo.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userInfo.email}
            </p>
          </div>
        )}
      </button>

      {isOpen && (
        <div className={`absolute ${isExpanded ? 'right-0' : 'right-0 translate-x-20'} bottom-full mb-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5`}>
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}