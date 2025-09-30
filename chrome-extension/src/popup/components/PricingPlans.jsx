import React, { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS } from '../../config/razorpay';
import paymentService from '../../services/paymentService';
import firebaseService from '../../services/firebaseService';

const PaymentModal = ({ isOpen, onClose, selectedPlan, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script dynamically
  useEffect(() => {
    if (isOpen && !razorpayLoaded) {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        setRazorpayLoaded(true);
      };
      script.onerror = (error) => {
        console.error('Failed to load Razorpay:', error);
        setError('Failed to load Razorpay. Please check your internet connection.');
      };
      document.head.appendChild(script);
    }
  }, [isOpen, razorpayLoaded]);

  const handlePayment = async () => {
    if (!user) {
      setError('Please sign in to continue with payment');
      return;
    }
    // Allow demo mode payment even if Razorpay fails to load
    if (!razorpayLoaded && !window.Razorpay) {
      console.log('Razorpay not loaded, using demo mode');
    }

    setLoading(true);
    setError('');

    try {
      // Demo mode payment if Razorpay is not available
      if (!razorpayLoaded && !window.Razorpay) {
        console.log('Demo mode: Simulating payment success');
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update user subscription in demo mode
        const subscriptionData = {
          plan: selectedPlan.id,
          status: 'active',
          paymentId: `demo-payment-${Date.now()}`,
          orderId: `demo-order-${Date.now()}`,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };

        // Update user data in Chrome storage
        const updatedUser = {
          ...user,
          subscription: subscriptionData,
          usage: {
            ...user.usage,
            promptsLimit: selectedPlan.id === 'pro' ? -1 : 100 // unlimited for pro
          }
        };

        await chrome.storage.local.set({ user: updatedUser });
        
        alert('🎉 Demo Payment Successful! Your subscription has been activated.');
        onClose();
        return;
      }

      // Create Razorpay order
      const orderResult = await paymentService.createOrder(selectedPlan, user.uid);
      
      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Configure Razorpay options
      const options = {
        key: 'rzp_test_RNhyHCN8abzxp0',
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        name: 'PromptInSTYL',
        description: `${selectedPlan.name} Subscription`,
        image: '/images/icon128.png',
        order_id: orderResult.order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verificationResult = await paymentService.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verificationResult.success) {
              // Update user subscription in Firebase
              const subscriptionData = {
                plan: selectedPlan,
                status: 'active',
                paymentId: verificationResult.payment_id,
                orderId: verificationResult.order_id,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
              };

              await firebaseService.updateSubscription(user.uid, subscriptionData);
              
              // Update usage limits
              await firebaseService.updateUsage(user.uid, {
                promptsLimit: selectedPlan === 'pro' ? 1000 : selectedPlan === 'enterprise' ? -1 : 50
              });

              alert('Payment successful! Your subscription has been activated.');
              onClose();
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const plan = SUBSCRIPTION_PLANS[selectedPlan];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upgrade to {plan.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-primary-600">₹{plan.price}</div>
            <div className="text-gray-600">per month</div>
          </div>

          <div className="space-y-2">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Pay ₹${plan.price}`}
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Secure payment powered by Razorpay
        </div>
      </div>
    </div>
  );
};

const PricingPlans = ({ user, onUpgrade }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleUpgrade = (planId) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Unlock the full potential of PromptInSTYL</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
          <div
            key={planId}
            className={`border rounded-lg p-6 ${
              planId === 'pro' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
            }`}
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="text-3xl font-bold text-primary-600 mt-2">₹{plan.price}</div>
              <div className="text-gray-600">per month</div>
            </div>

            <div className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade(planId)}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                planId === 'pro'
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
              }`}
            >
              {planId === 'pro' ? 'Most Popular' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedPlan={selectedPlan}
        user={user}
      />
    </div>
  );
};

export default PricingPlans;
