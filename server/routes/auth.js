const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { auth, isFirebaseAvailable } = require("../services/firebaseService");
const logger = require("../utils/logger");

// Register new user
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("displayName").trim().notEmpty(),
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

      const { email, password, displayName } = req.body;

      if (!isFirebaseAvailable) {
        return res.status(503).json({
          success: false,
          error: "Authentication service unavailable",
        });
      }

      // Create user in Firebase
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      logger.info(`User created successfully: ${userRecord.uid}`);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        uid: userRecord.uid,
      });
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create user",
      });
    }
  }
);

// Login existing user
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      if (!isFirebaseAvailable) {
        return res.status(503).json({
          success: false,
          error: "Authentication service unavailable",
        });
      }

      // Note: For email/password login, the client-side Firebase SDK should be used
      // This endpoint is for custom token generation if needed
      res.status(200).json({
        success: true,
        message: "Please use Firebase client SDK for email/password login",
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Login failed",
      });
    }
  }
);

// Password reset request
router.post(
  "/reset-password",
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      if (!isFirebaseAvailable) {
        return res.status(503).json({
          success: false,
          error: "Authentication service unavailable",
        });
      }

      const { email } = req.body;
      await auth.generatePasswordResetLink(email);

      res.json({
        success: true,
        message: "Password reset link sent to email",
      });
    } catch (error) {
      logger.error("Password reset error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to send reset email",
      });
    }
  }
);

// Get current user
router.get("/me", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get user info",
    });
  }
});

module.exports = router;
