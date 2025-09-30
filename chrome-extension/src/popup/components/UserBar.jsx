import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserBar = () => {
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-xs text-gray-500">Signed in</p>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        title="Sign Out"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
};

export default UserBar;
