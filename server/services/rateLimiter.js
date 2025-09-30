const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const logger = require("../utils/logger");

const getUserPlan = async (userId) => {
  logger.debug(`Checking plan for user: ${userId}`);
  if (userId.includes("pro-user")) {
    // You can create test users with 'pro-user' in their UID
    return "pro";
  }
  return "starter";
};
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  // `max` is a function that sets the limit dynamically
  max: async (req, res) => {
    if (!req.user || !req.user.uid) {
      return 5; // Low limit for requests without a valid user
    }
    const plan = await getUserPlan(req.user.uid);
    if (plan === "pro") {
      return 500; // Pro users get 500 requests per hour
    }
    return 50; // Starter users get 50 requests per hour
  },
  // This is the most important part: we use the user's ID as the key
  keyGenerator: (req, res) => {
    return req.user ? req.user.uid : ipKeyGenerator(req, res);
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error:
        "You have exceeded your request limit for this hour. Please try again later or upgrade your plan.",
    });
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = apiLimiter;
