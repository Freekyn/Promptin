// server/routes/api.js
const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const logger = require("../utils/logger");
const authenticateUser = require("../middleware/authenticateUser"); // <-- 1. IMPORT AUTH MIDDLEWARE
const apiLimiter = require("../services/rateLimiter"); // <-- 2. IMPORT RATE LIMITER
const Razorpay = require("razorpay");
const crypto = require("crypto");
const firebaseService = require("../services/firebaseService"); // Assuming this service can update user data

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Role categories and suggestions (Single source of truth)
const roleCategories = {
  creative: [
    "Copywriter",
    "Content Creator",
    "Graphic Designer",
    "Video Editor",
  ],
  technical: [
    "Data Engineer",
    "Software Developer",
    "DevOps Engineer",
    "Data Scientist",
  ],
  business: [
    "Product Manager",
    "Business Analyst",
    "Project Manager",
    "Sales Manager",
  ],
  education: ["Teacher", "Trainer", "Course Creator", "Educational Consultant"],
  healthcare: [
    "Medical Researcher",
    "Healthcare Analyst",
    "Public Health Advisor",
  ],
};

// === PUBLIC ROUTES (No login required) ===

// GET /api/roles - Get role categories and suggestions
router.get("/roles", (req, res) => {
  try {
    const { category } = req.query;
    if (category && roleCategories[category]) {
      return res.json({
        success: true,
        data: { category, roles: roleCategories[category] },
      });
    }
    res.json({
      success: true,
      data: {
        categories: Object.keys(roleCategories),
        allRoles: roleCategories,
      },
    });
  } catch (error) {
    logger.error("Fetch roles error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch roles" });
  }
});

// GET /api/frameworks/list - Get frameworks for selection dropdown
router.get("/frameworks/list", async (req, res) => {
  try {
    const frameworkFinder = req.app.locals.frameworkFinder;
    const frameworks = await frameworkFinder.getAllFrameworks();
    const groupedFrameworks = frameworks.reduce((acc, framework) => {
      const category = framework.category || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(framework);
      return acc;
    }, {});
    res.json({
      success: true,
      data: { frameworks: groupedFrameworks, total: frameworks.length },
    });
  } catch (error) {
    logger.error("Framework list error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch frameworks" });
  }
});

// === PROTECTED ROUTES START HERE ===
// Any route defined *after* this line will require a valid Firebase token.
router.use(authenticateUser);

// This endpoint is expensive, so we apply both authentication AND the rate limiter.
router.post(
  "/analyze-intent-enhanced",
  [
    apiLimiter,
    body("userRequest").trim().isLength({ min: 5 }).escape(),
    body("selectedRole").optional().trim().escape(),
    body("selectedFramework").optional().trim().escape(),
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

      const { userRequest, selectedRole, selectedFramework } = req.body;

      const intentAnalyzer = req.app.locals.intentAnalyzer;
      const result = await intentAnalyzer.generateIntelligentRecommendations(
        userRequest,
        {
          selectedRole,
          selectedFrameworkId: selectedFramework,
        }
      );

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Enhanced analysis error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze intent with enhancements",
      });
    }
  }
);

// POST /api/export-prompt - This route is now also protected
router.post("/export-prompt", async (req, res) => {
  try {
    const { prompt, role, framework, format, metadata = {} } = req.body;
    if (!prompt || !format) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt and format are required" });
    }

    const exportData = {
      prompt,
      role,
      framework: framework?.name,
      generatedAt: new Date().toISOString(),
      metadata,
      branding: {
        company: "PromptInSTYL",
        website: "https://promptinstyl.com",
        tagline: "World-Class AI Prompt Engineering Platform",
      },
    };

    let responseData, contentType, filename;

    switch (format.toLowerCase()) {
      case "json":
        responseData = JSON.stringify(exportData, null, 2);
        contentType = "application/json";
        filename = `prompt_${Date.now()}.json`;
        break;
      case "txt":
        responseData = formatAsText(exportData);
        contentType = "text/plain";
        filename = `prompt_${Date.now()}.txt`;
        break;
      case "md":
        responseData = formatAsMarkdown(exportData);
        contentType = "text/markdown";
        filename = `prompt_${Date.now()}.md`;
        break;
      case "html":
        responseData = formatAsHTML(exportData);
        contentType = "text/html";
        filename = `prompt_${Date.now()}.html`;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Unsupported format. Use: json, txt, md, html",
        });
    }

    res.json({
      success: true,
      data: {
        content: responseData,
        filename,
        contentType,
        size: Buffer.byteLength(responseData, "utf8"),
      },
    });
  } catch (error) {
    logger.error("Export error:", error);
    res.status(500).json({ success: false, error: "Failed to export prompt" });
  }
});

// === RAZORPAY PAYMENT ROUTES ===

// Endpoint to create a new subscription
router.post(
  "/create-subscription",
  [body("planId").trim().notEmpty().withMessage("Plan ID is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { planId } = req.body;
      const userId = req.user.uid;
    } catch (error) {
      logger.error("Subscription validation error:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to validate subscription request",
        });
    }

    const options = {
      plan_id: planId,
      total_count: 12, // The subscription will be for 12 months by default
      quantity: 1,
      customer_notify: 1,
    };

    try {
      const subscription = await razorpay.subscriptions.create(options);

      // Optionally, save the subscription ID to the user's profile in your DB
      // await firebaseService.updateUserProfile(userId, { subscriptionId: subscription.id });

      res.json({ success: true, subscription });
    } catch (error) {
      logger.error("Razorpay subscription creation failed:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create subscription" });
    }
  }
);

// Endpoint to verify the payment after the user completes the checkout
router.post(
  "/verify-payment",
  [
    body("razorpay_payment_id")
      .trim()
      .notEmpty()
      .withMessage("Payment ID is required"),
    body("razorpay_subscription_id")
      .trim()
      .notEmpty()
      .withMessage("Subscription ID is required"),
    body("razorpay_signature")
      .trim()
      .notEmpty()
      .withMessage("Signature is required"),
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

      const {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      } = req.body;
      const userId = req.user.uid;
    } catch (error) {
      logger.error("Payment verification validation error:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to validate payment verification request",
        });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // This is the crucial verification step
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      logger.info(`Payment verified successfully for user: ${userId}`);

      // IMPORTANT: Update the user's status in your database to 'active' or 'pro'
      await firebaseService.updateUserProfile(userId, {
        subscriptionStatus: "active",
        subscriptionId: razorpay_subscription_id,
      });

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      logger.error(`Payment verification failed for user: ${userId}`);
      res
        .status(400)
        .json({ success: false, error: "Payment verification failed" });
    }
  }
);

// === HELPER FUNCTIONS for EXPORT ===
function formatAsText(data) {
  return `
PromptInSTYL - AI Prompt Export
================================
Generated: ${data.generatedAt}
Role: ${data.role || "Not specified"}
Framework: ${data.framework || "Custom"}
PROMPT:
${data.prompt}
---
${data.branding.company} - ${data.branding.tagline}
${data.branding.website}
`;
}

function formatAsMarkdown(data) {
  return `# PromptInSTYL - AI Prompt Export
**Generated:** ${data.generatedAt}
**Role:** ${data.role || "Not specified"}
**Framework:** ${data.framework || "Custom"}
## Prompt
\`\`\`
${data.prompt}
\`\`\`
---
*Generated by [${data.branding.company}](${data.branding.website}) - ${
    data.branding.tagline
  }*
`;
}

function formatAsHTML(data) {
  return `<!DOCTYPE html>
<html>
<head>
    <title>PromptInSTYL - AI Prompt Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .prompt-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PromptInSTYL - AI Prompt Export</h1>
        <p><strong>Generated:</strong> ${data.generatedAt}</p>
        <p><strong>Role:</strong> ${data.role || "Not specified"}</p>
        <p><strong>Framework:</strong> ${data.framework || "Custom"}</p>
    </div>
    <div class="prompt-box">
        <h2>Prompt</h2>
        <pre style="white-space: pre-wrap; font-family: 'SF Mono', Monaco, monospace;">${
          data.prompt
        }</pre>
    </div>
    <div class="footer">
        <p><strong>${data.branding.company}</strong> - ${
    data.branding.tagline
  }</p>
        <p><a href="${data.branding.website}">${data.branding.website}</a></p>
    </div>
</body>
</html>`;
}

module.exports = router;
