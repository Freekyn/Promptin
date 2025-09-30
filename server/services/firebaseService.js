const admin = require("firebase-admin");
const logger = require("../utils/logger"); // Assuming you have a logger utility

let isFirebaseAvailable = false;
let auth = null;
let firestore = null;

// --- SECURE INITIALIZATION ---
// This block safely initializes Firebase using the secret stored in your server environment.
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    auth = admin.auth();
    firestore = admin.firestore();
    isFirebaseAvailable = true;
    logger.info("✅ Firebase Admin initialized successfully");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Fallback to old format
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    auth = admin.auth();
    firestore = admin.firestore();
    isFirebaseAvailable = true;
    logger.info("✅ Firebase Admin initialized successfully (legacy format)");
  } else {
    logger.warn(
      "Firebase Admin key not found. Using SQLite fallback for user data."
    );
  }
} catch (error) {
  logger.error("❌ Firebase Admin initialization failed:", error);
}
// --- END INITIALIZATION ---

class FirebaseService {
  constructor() {
    this.isFirebaseAvailable = isFirebaseAvailable;
  }

  // User Management
  async createUserProfile(uid, userData) {
    if (!this.isFirebaseAvailable) {
      return this.createUserProfileSQLite(uid, userData);
    }

    try {
      const userRef = firestore.collection("users").doc(uid);
      await userRef.set({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      logger.error("Firebase user creation error:", error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile(uid) {
    if (!this.isFirebaseAvailable) {
      return this.getUserProfileSQLite(uid);
    }

    try {
      const userDoc = await firestore.collection("users").doc(uid).get();
      if (userDoc.exists) {
        return { success: true, data: userDoc.data() };
      } else {
        return { success: false, error: "User not found" };
      }
    } catch (error) {
      logger.error("Firebase get user error:", error);
      return { success: false, error: error.message };
    }
  }

  // History Management
  async saveUserHistory(uid, historyEntry) {
    if (!this.isFirebaseAvailable) {
      return this.saveUserHistorySQLite(uid, historyEntry);
    }

    try {
      const historyRef = firestore
        .collection("users")
        .doc(uid)
        .collection("history");
      await historyRef.add({
        ...historyEntry,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      logger.error("Firebase save history error:", error);
      return { success: false, error: error.message };
    }
  }

  async getUserHistory(uid, limit = 50) {
    if (!this.isFirebaseAvailable) {
      return this.getUserHistorySQLite(uid, limit);
    }

    try {
      const historySnapshot = await firestore
        .collection("users")
        .doc(uid)
        .collection("history")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

      const history = [];
      historySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return { success: true, data: history };
    } catch (error) {
      logger.error("Firebase get history error:", error);
      return { success: false, error: error.message };
    }
  }

  // SQLite Fallback Methods
  createUserProfileSQLite(uid, userData) {
    const sqlite3 = require("sqlite3").verbose();
    const path = require("path");

    return new Promise((resolve) => {
      const dbPath = path.join(__dirname, "../data/frameworks.db");
      const db = new sqlite3.Database(dbPath);

      db.run(
        `
        CREATE TABLE IF NOT EXISTS users (
          uid TEXT PRIMARY KEY,
          email TEXT,
          display_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            logger.error("Create users table error:", err);
            resolve({ success: false, error: err.message });
            return;
          }

          db.run(
            `
          INSERT OR REPLACE INTO users (uid, email, display_name, last_login)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `,
            [uid, userData.email, userData.displayName],
            (err) => {
              db.close();
              if (err) {
                resolve({ success: false, error: err.message });
              } else {
                resolve({ success: true });
              }
            }
          );
        }
      );
    });
  }

  saveUserHistorySQLite(uid, historyEntry) {
    const sqlite3 = require("sqlite3").verbose();
    const path = require("path");

    return new Promise((resolve) => {
      const dbPath = path.join(__dirname, "../data/frameworks.db");
      const db = new sqlite3.Database(dbPath);

      db.run(
        `
        CREATE TABLE IF NOT EXISTS user_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uid TEXT,
          type TEXT,
          request TEXT,
          framework TEXT,
          prompt TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            logger.error("Create history table error:", err);
            resolve({ success: false, error: err.message });
            return;
          }

          db.run(
            `
          INSERT INTO user_history (uid, type, request, framework, prompt)
          VALUES (?, ?, ?, ?, ?)
        `,
            [
              uid,
              historyEntry.type,
              historyEntry.request,
              historyEntry.framework,
              historyEntry.prompt,
            ],
            (err) => {
              db.close();
              if (err) {
                resolve({ success: false, error: err.message });
              } else {
                resolve({ success: true });
              }
            }
          );
        }
      );
    });
  }

  getUserHistorySQLite(uid, limit = 50) {
    const sqlite3 = require("sqlite3").verbose();
    const path = require("path");

    return new Promise((resolve) => {
      const dbPath = path.join(__dirname, "../data/frameworks.db");
      const db = new sqlite3.Database(dbPath);

      db.all(
        `
        SELECT * FROM user_history 
        WHERE uid = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `,
        [uid, limit],
        (err, rows) => {
          db.close();
          if (err) {
            resolve({ success: false, error: err.message });
          } else {
            resolve({ success: true, data: rows || [] });
          }
        }
      );
    });
  }
}

// Export a single instance of the service
const firebaseServiceInstance = new FirebaseService();

// Also export the auth object directly for the middleware
module.exports = {
  ...firebaseServiceInstance, // Export all methods from the instance
  auth, // Export the auth object for token verification
  isFirebaseAvailable,
};
