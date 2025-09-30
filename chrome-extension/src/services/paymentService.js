// Simplified payment service for browser environment
import { RAZORPAY_CONFIG, SUBSCRIPTION_PLANS } from '../config/razorpay';

class PaymentService {
  constructor() {
    this.keyId = RAZORPAY_CONFIG.key_id;
    this.keySecret = RAZORPAY_CONFIG.key_secret;
  }

  // Create a payment order (simplified for browser)
  async createOrder(planId, userId) {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // In a real implementation, you would call your backend API
      // For now, we'll return mock data
      const orderData = {
        id: `order_${userId}_${Date.now()}`,
        amount: plan.price * 100, // Convert to paise
        currency: RAZORPAY_CONFIG.currency,
        receipt: `order_${userId}_${Date.now()}`,
        status: 'created',
        notes: {
          plan_id: planId,
          user_id: userId,
          plan_name: plan.name
        }
      };

      return {
        success: true,
        order: orderData,
        plan: plan
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment signature (simplified)
  async verifyPayment(paymentData) {
    try {
      // In a real implementation, you would verify the signature on your backend
      // For demo purposes, we'll assume all payments are valid
      return {
        success: true,
        payment_id: paymentData.razorpay_payment_id,
        order_id: paymentData.razorpay_order_id
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      // Mock payment details
      const payment = {
        id: paymentId,
        amount: 199900, // ₹1999 in paise
        currency: 'INR',
        status: 'captured',
        method: 'card',
        created_at: Date.now()
      };

      return {
        success: true,
        payment: payment
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create subscription (simplified)
  async createSubscription(planId, userId) {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Mock subscription data
      const subscriptionData = {
        id: `sub_${userId}_${Date.now()}`,
        plan_id: plan.id,
        status: 'active',
        current_start: Date.now(),
        current_end: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        notes: {
          plan_id: planId,
          user_id: userId,
          plan_name: plan.name
        }
      };

      return {
        success: true,
        subscription: subscriptionData,
        plan: plan
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get subscription details
  async getSubscriptionDetails(subscriptionId) {
    try {
      // Mock subscription details
      const subscription = {
        id: subscriptionId,
        plan_id: 'plan_pro',
        status: 'active',
        current_start: Date.now(),
        current_end: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      return {
        success: true,
        subscription: subscription
      };
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      // Mock cancellation
      const subscription = {
        id: subscriptionId,
        status: 'cancelled',
        cancelled_at: Date.now()
      };

      return {
        success: true,
        subscription: subscription
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new PaymentService();
