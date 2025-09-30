const { auth, isFirebaseAvailable } = require("../services/firebaseService");
const logger = require("../utils/logger");

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    if (!isFirebaseAvailable) {
      logger.warn(
        "Firebase not available, using development mode authentication"
      );
      // Development mode - basic validation
      req.user = {
        uid: "dev-user-" + Math.random().toString(36).substr(2, 9),
        email: "dev@example.com",
      };
      return next();
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      role: decodedToken.role || "user",
    };

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

module.exports = authenticateUser;
