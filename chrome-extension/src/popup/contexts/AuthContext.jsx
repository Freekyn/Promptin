import React, { createContext, useContext, useState, useEffect } from 'react';
import firebaseService, { auth } from '../../services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const checkAuthState = async () => {
      try {
        const result = await chrome.storage.local.get(['user', 'authToken']);
        if (result.user && result.authToken) {
          setUser(result.user);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userData = await firebaseService.getUserData(firebaseUser.uid);
        const fullUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          ...userData
        };

        // Store user data in Chrome storage
        await chrome.storage.local.set({
          user: fullUserData,
          authToken: await firebaseUser.getIdToken()
        });

        setUser(fullUserData);
      } else {
        // Clear stored data
        await chrome.storage.local.remove(['user', 'authToken']);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      // Demo mode - allow any email/password combination
      if (email && password) {
        const demoUser = {
          uid: `demo-user-${Date.now()}`,
          email: email,
          displayName: email.split('@')[0],
          photoURL: null,
          emailVerified: true,
          subscription: {
            plan: 'free',
            status: 'active',
            startDate: new Date(),
            endDate: null
          },
          usage: {
            promptsUsed: 0,
            promptsLimit: 10,
            lastReset: new Date()
          }
        };

        setUser(demoUser);
        await chrome.storage.local.set({
          user: demoUser,
          authToken: `demo-token-${Date.now()}`
        });

        return { success: true, user: demoUser };
      }
      
      return { success: false, error: 'Please enter email and password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      // Demo mode - allow any registration
      if (name && email && password) {
        const demoUser = {
          uid: `demo-user-${Date.now()}`,
          email: email,
          displayName: name,
          photoURL: null,
          emailVerified: true,
          subscription: {
            plan: 'free',
            status: 'active',
            startDate: new Date(),
            endDate: null
          },
          usage: {
            promptsUsed: 0,
            promptsLimit: 10,
            lastReset: new Date()
          }
        };

        setUser(demoUser);
        await chrome.storage.local.set({
          user: demoUser,
          authToken: `demo-token-${Date.now()}`
        });

        return { success: true, user: demoUser };
      }
      
      return { success: false, error: 'Please fill in all fields' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Demo mode - just clear local storage
      await chrome.storage.local.remove(['user', 'authToken']);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email) => {
    try {
      return await firebaseService.resetPassword(email);
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) return { success: false, error: 'No user logged in' };
      
      const result = await firebaseService.updateUserData(user.uid, updates);
      if (result.success) {
        // Update local user state
        setUser({ ...user, ...updates });
        // Update stored data
        await chrome.storage.local.set({
          user: { ...user, ...updates },
          authToken: await firebaseService.auth.currentUser.getIdToken()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
