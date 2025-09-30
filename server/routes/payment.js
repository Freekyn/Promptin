const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const logger = require("../utils/logger");
const authenticateUser = require("../middleware/authenticateUser");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret",
});

// Create payment order
router.post(
  "/create-order",
  authenticateUser,
  [
    body("amount").isNumeric().withMessage("Amount must be a number"),
    body("currency").optional().isString().withMessage("Currency must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { amount, currency = "INR" } = req.body;

      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1,
      };

      const order = await razorpay.orders.create(options);

      res.json({
        success: true,
        order,
        message: "Order created successfully",
      });
    } catch (error) {
      logger.error("Payment order creation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create payment order",
      });
    }
  }
);

// Verify payment
router.post(
  "/verify-payment",
  authenticateUser,
  [
    body("razorpay_order_id").notEmpty().withMessage("Order ID is required"),
    body("razorpay_payment_id").notEmpty().withMessage("Payment ID is required"),
    body("razorpay_signature").notEmpty().withMessage("Signature is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret")
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        // Payment is successful, update user subscription
        logger.info(`Payment verified for user: ${req.user.uid}`);
        
        res.json({
          success: true,
          message: "Payment verified successfully",
          paymentId: razorpay_payment_id,
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Payment verification failed",
        });
      }
    } catch (error) {
      logger.error("Payment verification error:", error);
      res.status(500).json({
        success: false,
        error: "Payment verification failed",
      });
    }
  }
);

// Get payment methods
router.get("/methods", (req, res) => {
  res.json({
    success: true,
    methods: [
      {
        id: "card",
        name: "Credit/Debit Card",
        description: "Pay with your credit or debit card",
      },
      {
        id: "netbanking",
        name: "Net Banking",
        description: "Pay using your bank account",
      },
      {
        id: "upi",
        name: "UPI",
        description: "Pay using UPI ID or QR code",
      },
      {
        id: "wallet",
        name: "Digital Wallet",
        description: "Pay using digital wallets",
      },
    ],
  });
});

module.exports = router;
