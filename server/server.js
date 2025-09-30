// Enhanced server.js with new features
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");

// Import services with corrected name
const WorldClassIntentAnalyzer = require("./services/intentAnalyzer");
const FrameworkFinder = require("./services/frameworkFinder");
const promptBuilder = require("./services/promptBuilder");

// Import routes
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
// const paymentRoutes = require("./routes/payment"); // Temporarily disabled

const app = express();
app.set("trust proxy", 1); // Trust Fly.io proxy for rate limiting
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://www.gstatic.com",
          "https://apis.google.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.openai.com",
          "https://api.razorpay.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://*.firebaseapp.com",
          "https://*.firebase.com",
          "https://www.gstatic.com",
          "https://apis.google.com",
        ],
        frameSrc: ["'self'", "https://apis.google.com"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: "Rate limit exceeded for this endpoint. Please try again later.",
  },
});

app.use("/api", limiter);
app.use("/api/analyze-intent", strictLimiter);
app.use("/api/analyze-intent-enhanced", strictLimiter);
app.use("/api/generate-adaptive-prompt", strictLimiter);

// Middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = [
      "https://server-thrumming-paper-2833.fly.dev",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://helppromptinstyl-5ddac.firebaseapp.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      process.env.FRONTEND_URL,
    ].filter(Boolean); // Remove undefined values

    if (
      whitelist.indexOf(origin) !== -1 ||
      !origin ||
      origin.startsWith("chrome-extension://") ||
      origin.startsWith("moz-extension://") ||
      origin.startsWith("safari-extension://")
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Headers",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Static files for extension assets
app.use("/extension", express.static(path.join(__dirname, "extension")));

// Initialize services
let intentAnalyzer, frameworkFinder;

async function initializeServices() {
  try {
    console.log("🚀 Initializing PromptInSTYL services...");

    frameworkFinder = new FrameworkFinder();
    await frameworkFinder.initialize();
    console.log("✅ Framework Finder initialized");

    // Correctly instantiate WorldClassIntentAnalyzer
    intentAnalyzer = new WorldClassIntentAnalyzer();
    console.log("✅ Intent Analyzer initialized");

    // promptBuilder is already an instance, no need to instantiate
    console.log("✅ Prompt Builder initialized");

    // Make services available to routes
    app.locals.intentAnalyzer = intentAnalyzer;
    app.locals.frameworkFinder = frameworkFinder;
    app.locals.promptBuilder = promptBuilder;

    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Service initialization failed:", error);
    process.exit(1);
  }
}

// API routes
app.use("/api", apiRoutes);
app.use("/api/auth", authRoutes);
// app.use("/api/payment", paymentRoutes); // Temporarily disabled

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const frameworkStats = await app.locals.frameworkFinder.getFrameworkStats();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      uptime: process.uptime(),
      frameworks: frameworkStats.total || 0,
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Welcome page for new users
app.get("/welcome", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Welcome to PromptInSTYL</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh; color: white;
            }
            .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 16px; }
            h1 { font-size: 2.5em; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Welcome to PromptInSTYL 2.0</h1>
            <p>Your world-class AI prompt engineering platform is ready to go!</p>
        </div>
    </body>
    </html>
  `);
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  const isDevelopment = process.env.NODE_ENV !== "production";
  res.status(error.status || 500).json({
    success: false,
    error: isDevelopment ? error.message : "Internal server error",
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Graceful shutdown handling
let runningServer = null;

const shutdown = () => {
  console.log("🔄 Shutting down gracefully...");
  if (runningServer) {
    runningServer.close(() => {
      console.log("✅ Process terminated");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Unhandled error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    runningServer = app.listen(PORT, "0.0.0.0", () => {
      console.log("\n🎉 PromptInSTYL Enhanced Server Started!");
      console.log(`📍 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log("\n✨ Ready to process enhanced prompts!\n");
    });
    runningServer.timeout = 300000;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
