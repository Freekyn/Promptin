import React, { useState } from 'react';
import PricingPlans from './PricingPlans';

const SubscriptionStatus = ({ user, onUpgrade }) => {
  const [showPricing, setShowPricing] = useState(false);

  if (!user || !user.subscription) {
    return (
      <div className="card">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Plan</h3>
          <p className="text-gray-600 mb-4">You're currently on the free plan</p>
          <button
            onClick={() => setShowPricing(true)}
            className="btn-primary"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  const { subscription, usage } = user;
  const isActive = subscription.status === 'active';
  const isExpired = new Date(subscription.endDate) < new Date();

  const getPlanInfo = (planName) => {
    const plans = {
      'free': { name: 'Free Plan', color: 'gray', limit: 10 },
      'basic': { name: 'Basic Plan', color: 'blue', limit: 100 },
      'pro': { name: 'Pro Plan', color: 'purple', limit: -1 }
    };
    return plans[planName] || plans['free'];
  };

  const planInfo = getPlanInfo(subscription.plan);
  const usagePercentage = planInfo.limit === -1 ? 0 : (usage?.promptsUsed || 0) / planInfo.limit * 100;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{planInfo.name}</h3>
            <p className={`text-sm ${
              isActive && !isExpired ? 'text-green-600' : 'text-red-600'
            }`}>
              {isActive && !isExpired ? 'Active' : 'Expired'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            planInfo.color === 'gray' ? 'bg-gray-100 text-gray-800' :
            planInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
            planInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {subscription.plan.toUpperCase()}
          </div>
        </div>

        {planInfo.limit !== -1 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Usage this month</span>
              <span>{usage?.promptsUsed || 0} / {planInfo.limit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  usagePercentage > 90 ? 'bg-red-500' :
                  usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {subscription.endDate && (
          <div className="text-sm text-gray-600 mb-4">
            {isExpired ? 'Expired on' : 'Expires on'}: {new Date(subscription.endDate).toLocaleDateString()}
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => setShowPricing(true)}
            className="flex-1 btn-primary"
          >
            {isExpired ? 'Renew' : 'Upgrade'}
          </button>
          {isActive && !isExpired && (
            <button
              onClick={() => {/* Handle cancellation */}}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {showPricing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <button
                onClick={() => setShowPricing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PricingPlans user={user} onUpgrade={onUpgrade} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
