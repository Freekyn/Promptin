import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Export auth for external use
export { auth };

class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.setupAuthListener();
  }

  // Setup authentication state listener
  setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        // Update user's last login time
        await this.updateUserLastLogin(user.uid);
      }
    });
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userData = await this.getUserData(user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          ...userData
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Create new user account
  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: displayName
      });

      // Send email verification
      await sendEmailVerification(user);

      // Create user document in Firestore
      await this.createUserDocument(user.uid, {
        email: email,
        displayName: displayName,
        createdAt: serverTimestamp(),
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: serverTimestamp(),
          endDate: null
        },
        usage: {
          promptsUsed: 0,
          promptsLimit: 10, // Free plan limit
          lastReset: serverTimestamp()
        }
      });

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          photoURL: user.photoURL,
          emailVerified: false
        }
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create user document in Firestore
  async createUserDocument(uid, userData) {
    try {
      await setDoc(doc(db, 'users', uid), userData);
      return { success: true };
    } catch (error) {
      console.error('Error creating user document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Update user data
  async updateUserData(uid, data) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update subscription
  async updateSubscription(uid, subscriptionData) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        subscription: {
          ...subscriptionData,
          updatedAt: serverTimestamp()
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update usage statistics
  async updateUsage(uid, usageData) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        usage: {
          ...usageData,
          updatedAt: serverTimestamp()
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating usage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Record prompt generation
  async recordPromptGeneration(uid, promptData) {
    try {
      await addDoc(collection(db, 'prompts'), {
        userId: uid,
        prompt: promptData.prompt,
        role: promptData.role,
        platform: promptData.platform,
        createdAt: serverTimestamp()
      });

      // Update user usage
      const userData = await this.getUserData(uid);
      if (userData) {
        const newUsage = userData.usage.promptsUsed + 1;
        await this.updateUsage(uid, {
          promptsUsed: newUsage
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording prompt generation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update last login time
  async updateUserLastLogin(uid) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Get user's prompt history
  async getUserPrompts(uid, limit = 50) {
    try {
      const q = query(
        collection(db, 'prompts'),
        where('userId', '==', uid),
        // orderBy('createdAt', 'desc'),
        // limit(limit)
      );
      const querySnapshot = await getDocs(q);
      const prompts = [];
      querySnapshot.forEach((doc) => {
        prompts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return {
        success: true,
        prompts: prompts
      };
    } catch (error) {
      console.error('Error getting user prompts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get error message from Firebase error code
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

export default new FirebaseService();
