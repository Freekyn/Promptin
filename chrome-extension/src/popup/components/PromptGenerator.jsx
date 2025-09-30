import React, { useState } from 'react';

const PromptGenerator = ({
  roles,
  userRequest,
  selectedRole,
  onRoleChange
}) => {
  const [expandedSections, setExpandedSections] = useState({
    role: false,
    platform: false
  });

  const [customRole, setCustomRole] = useState('');
  const [useCustomRole, setUseCustomRole] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Don't select the category as a role, just show the roles in that category
  };

  const handleRoleSelect = (role) => {
    onRoleChange(role);
    setUseCustomRole(false);
    setCustomRole('');
    setSelectedCategory(null); // Clear category selection when a specific role is selected
  };

  const handleCustomRoleToggle = (enabled) => {
    setUseCustomRole(enabled);
    if (enabled) {
      onRoleChange(customRole);
    } else {
      onRoleChange(null);
      setCustomRole('');
    }
  };

  const handleCustomRoleChange = (value) => {
    setCustomRole(value);
    if (useCustomRole) {
      onRoleChange(value);
    }
  };



  // Debug logging
  console.log('PromptGenerator - roles:', roles);
  console.log('PromptGenerator - selectedRole:', selectedRole);
  console.log('PromptGenerator - selectedCategory:', selectedCategory);

  return (
    <div className="space-y-4">
      {/* Role Selection */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('role')}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors duration-200"
        >
          <span className="font-medium text-gray-900">🎭 Role Selection</span>
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${
              expandedSections.role ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.role && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {Object.keys(roles).map(category => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
            
            {selectedCategory && roles[selectedCategory] && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                {roles[selectedCategory].map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors duration-200 ${
                      selectedRole === role ? 'bg-primary-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
            
            {selectedRole && (
              <div className="mt-2 p-2 bg-primary-50 border border-primary-200 rounded-md">
                <p className="text-sm text-primary-700">
                  <strong>Selected Role:</strong> {selectedRole}
                </p>
              </div>
            )}
            
            <div className="mt-3">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={useCustomRole}
                  onChange={(e) => handleCustomRoleToggle(e.target.checked)}
                  className="mr-2"
                />
                Use custom role
              </label>
              {useCustomRole && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => handleCustomRoleChange(e.target.value)}
                  placeholder="Enter custom role..."
                  className="w-full mt-2 input-field"
                />
              )}
            </div>
          </div>
        )}
      </div>


      {/* AI Platform Suggestions */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('platform')}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors duration-200"
        >
          <span className="font-medium text-gray-900">🤖 AI Platform Suggestions</span>
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${
              expandedSections.platform ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
            {expandedSections.platform && (
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center mb-3">
                    AI Platform Recommendations
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-green-600">C</span>
                        </div>
                        <span className="text-sm font-medium">ChatGPT</span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">95%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">C</span>
                        </div>
                        <span className="text-sm font-medium">Claude</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">90%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-600">G</span>
                        </div>
                        <span className="text-sm font-medium">Gemini</span>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">85%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Recommendations based on prompt analysis
                  </p>
                </div>
              </div>
            )}
      </div>
    </div>
  );
};

export default PromptGenerator;
