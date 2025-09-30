// Firebase configuration
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyx1oaf6oORbnbOXFpdaJYl90kKGw8HIw",
  authDomain: "helppromptinstyl-5ddac.firebaseapp.com",
  projectId: "helppromptinstyl-5ddac",
  storageBucket: "helppromptinstyl-5ddac.firebasestorage.app",
  messagingSenderId: "1085426770625",
  appId: "1:1085426770625:web:7dcf0afba00e66628cea40",
  measurementId: "G-XQCD2FMTGF",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.setupAuthListener();
  }

  setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.updateStoredAuth();
      this.notifyAuthChange();
    });
  }

  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await this.createUserProfile(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signUpWithEmail(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await this.createUserProfile(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await this.createUserProfile(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    } else {
      // Update last login
      await setDoc(
        userRef,
        { lastLogin: new Date().toISOString() },
        { merge: true }
      );
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      chrome.storage.local.clear(); // Clear all stored data
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateStoredAuth() {
    chrome.storage.local.set({
      isAuthenticated: !!this.currentUser,
      user: this.currentUser
        ? {
            uid: this.currentUser.uid,
            email: this.currentUser.email,
            displayName: this.currentUser.displayName,
          }
        : null,
    });
  }

  notifyAuthChange() {
    // Notify popup about auth state change
    chrome.runtime.sendMessage({
      action: "authStateChanged",
      isAuthenticated: !!this.currentUser,
      user: this.currentUser,
    });
  }
}

window.authManager = new AuthManager();
