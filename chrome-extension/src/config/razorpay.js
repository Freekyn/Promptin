// Razorpay configuration
export const RAZORPAY_CONFIG = {
  key_id: 'rzp_test_RNhyHCN8abzxp0',
  key_secret: '0d66DN7I4ITFFgbpPKmkTJLt',
  currency: 'INR',
  name: 'PromptInSTYL',
  description: 'AI-Powered Prompt Engineering Platform',
  image: '/images/icon128.png',
  theme: {
    color: '#3B82F6'
  }
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'plan_basic',
    name: 'Basic Plan',
    price: 349, // ₹349
    duration: 'monthly',
    features: [
      '100 prompts per month',
      'All AI platforms',
      'Email support',
      'Standard templates',
      'Basic analytics'
    ]
  },
  pro: {
    id: 'plan_pro',
    name: 'Pro Plan',
    price: 599, // ₹599
    duration: 'monthly',
    features: [
      'Unlimited prompts',
      'All AI platforms',
      'Priority support',
      'Advanced templates',
      'Custom roles',
      'Export features',
      'Advanced analytics',
      'API access'
    ]
  }
};

export default RAZORPAY_CONFIG;
