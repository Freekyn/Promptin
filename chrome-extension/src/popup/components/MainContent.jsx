import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';
import PromptGenerator from './PromptGenerator';
import ResultsSection from './ResultsSection';
import SubscriptionStatus from './SubscriptionStatus';
import firebaseService from '../../services/firebaseService';

const MainContent = () => {
  const [userRequest, setUserRequest] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [result, setResult] = useState(null);
  const [roles, setRoles] = useState({});
  const [showSubscription, setShowSubscription] = useState(false);
  const { loading, error, generatePrompt, getRoles, clearError } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await getRoles();
      if (response.success) {
        console.log('Roles loaded:', response.data.allRoles);
        setRoles(response.data.allRoles);
      } else {
        console.log('Roles response failed, using fallback');
        loadFallbackRoles();
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      loadFallbackRoles();
    }
  };

  const loadFallbackRoles = () => {
    const fallbackRoles = {
      creative: ["Copywriter", "Content Creator", "Graphic Designer", "Video Editor", "Creative Director"],
      technical: ["Software Developer", "Data Scientist", "DevOps Engineer", "System Administrator", "Technical Writer"],
      business: ["Marketing Manager", "Sales Representative", "Project Manager", "Business Analyst", "Product Manager"],
      education: ["Teacher", "Curriculum Developer", "Educational Consultant", "Training Specialist", "Academic Researcher"],
      healthcare: ["Doctor", "Nurse", "Medical Researcher", "Healthcare Administrator", "Clinical Specialist"]
    };
    console.log('Using fallback roles:', fallbackRoles);
    setRoles(fallbackRoles);
  };


  const handleGenerate = async () => {
    if (!userRequest.trim()) {
      return;
    }

    // Check subscription limits
    if (user && user.usage) {
      const planLimits = {
        'free': 10,
        'basic': 100,
        'pro': -1 // unlimited
      };
      
      const currentPlan = user.subscription?.plan || 'free';
      const limit = planLimits[currentPlan];
      
      if (limit !== -1 && user.usage.promptsUsed >= limit) {
        setError('You have reached your monthly prompt limit. Please upgrade your plan to continue.');
        setShowSubscription(true);
        return;
      }
    }

    try {
      clearError();
      const response = await generatePrompt(userRequest, selectedRole);
      
      if (response.success) {
        setResult(response.data);
        
        // Record prompt generation in Firebase
        if (user) {
          await firebaseService.recordPromptGeneration(user.uid, {
            prompt: userRequest,
            role: selectedRole,
            platform: response.data.platformRecommendations?.recommendations?.[0]?.name || 'Unknown'
          });
        }
      } else {
        console.error('Generation failed:', response.error);
        // Show a user-friendly error message
        setError('Failed to generate prompt. Please try again.');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError('An error occurred while generating the prompt. Please try again.');
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Subscription Status */}
      {user && (
        <SubscriptionStatus 
          user={user} 
          onUpgrade={() => setShowSubscription(true)} 
        />
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Enhanced Prompt</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your prompt needs
            </label>
            <textarea
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              placeholder="e.g., I need to create a marketing strategy for our SaaS product..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

            <PromptGenerator
              roles={roles}
              userRequest={userRequest}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
            />

          <button
            onClick={handleGenerate}
            disabled={loading || !userRequest.trim()}
            className="w-full btn-primary"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner mr-2"></div>
                Generating...
              </div>
            ) : (
              '🚀 Generate Enhanced Prompt'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

        {result && (
          <ResultsSection
            result={result}
          />
        )}
    </div>
  );
};

export default MainContent;
