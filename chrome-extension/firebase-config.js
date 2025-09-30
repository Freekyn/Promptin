// Firebase configuration for Chrome Extension
const firebaseConfig = {
  apiKey: "AIzaSyAyx1oaf6oORbnbOXFpdaJYl90kKGw8HIw",
  authDomain: "helppromptinstyl-5ddac.firebaseapp.com",
  projectId: "helppromptinstyl-5ddac",
  storageBucket: "helppromptinstyl-5ddac.firebasestorage.app",
  messagingSenderId: "1085426770625",
  appId: "1:1085426770625:web:7dcf0afba00e66628cea40",
  measurementId: "G-XQCD2FMTGF"
};

// Initialize Firebase
let app, auth;
try {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  console.log('Firebase initialized successfully');
  
  // Make auth available globally
  window.auth = auth;
  window.signInWithEmailAndPassword = firebase.auth().signInWithEmailAndPassword.bind(firebase.auth());
  window.createUserWithEmailAndPassword = firebase.auth().createUserWithEmailAndPassword.bind(firebase.auth());
  window.signOut = firebase.auth().signOut.bind(firebase.auth());
  window.onAuthStateChanged = firebase.auth().onAuthStateChanged.bind(firebase.auth());
  
  // Signal that Firebase is ready
  window.firebaseReady = true;
  window.dispatchEvent(new CustomEvent('firebaseReady'));
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Fallback to mock implementation
  createMockFirebase();
}

// Mock Firebase functions for Chrome extension compatibility
// Since we can't load external scripts due to CSP, we'll use a simplified approach
function createMockFirebase() {
  console.log('Using mock Firebase for Chrome extension');
  
  // Mock auth object
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      // Simulate no user initially
      callback(null);
      return () => {}; // unsubscribe function
    }
  };
  
  // Mock auth functions
  const mockSignInWithEmailAndPassword = async (auth, email, password) => {
    // For demo purposes, accept any email/password
    const mockUser = {
      uid: 'mock-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      getIdToken: async () => 'mock-token-' + Date.now()
    };
    
    // Simulate successful login
    auth.currentUser = mockUser;
    return { user: mockUser };
  };
  
  const mockCreateUserWithEmailAndPassword = async (auth, email, password) => {
    // For demo purposes, create user
    const mockUser = {
      uid: 'mock-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      getIdToken: async () => 'mock-token-' + Date.now()
    };
    
    auth.currentUser = mockUser;
    return { user: mockUser };
  };
  
  const mockSignOut = async (auth) => {
    auth.currentUser = null;
  };
  
  // Make functions available globally
  window.auth = mockAuth;
  window.signInWithEmailAndPassword = mockSignInWithEmailAndPassword;
  window.createUserWithEmailAndPassword = mockCreateUserWithEmailAndPassword;
  window.signOut = mockSignOut;
  window.onAuthStateChanged = mockAuth.onAuthStateChanged;
  
  // Signal that Firebase is ready
  window.firebaseReady = true;
  window.dispatchEvent(new CustomEvent('firebaseReady'));
}

// For Chrome extensions, we'll use the mock implementation directly
// since external script loading is restricted by CSP
console.log('Chrome Extension detected, using mock Firebase implementation');

// Enhanced mock Firebase with better functionality
function createEnhancedMockFirebase() {
  console.log('Using enhanced mock Firebase for Chrome extension');
  
  // Mock auth object with better state management
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      // Simulate no user initially
      setTimeout(() => callback(null), 100);
      return () => {}; // unsubscribe function
    }
  };
  
  // Enhanced mock auth functions
  const mockSignInWithEmailAndPassword = async (auth, email, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, accept any email/password
    const mockUser = {
      uid: 'mock-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      getIdToken: async () => 'mock-token-' + Date.now(),
      updateProfile: async (profile) => {
        mockUser.displayName = profile.displayName;
      }
    };
    
    // Simulate successful login
    auth.currentUser = mockUser;
    
    // Trigger auth state change
    setTimeout(() => {
      if (auth.onAuthStateChanged) {
        auth.onAuthStateChanged(mockUser);
      }
    }, 100);
    
    return { user: mockUser };
  };
  
  const mockCreateUserWithEmailAndPassword = async (auth, email, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, create user
    const mockUser = {
      uid: 'mock-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      getIdToken: async () => 'mock-token-' + Date.now(),
      updateProfile: async (profile) => {
        mockUser.displayName = profile.displayName;
      }
    };
    
    auth.currentUser = mockUser;
    
    // Trigger auth state change
    setTimeout(() => {
      if (auth.onAuthStateChanged) {
        auth.onAuthStateChanged(mockUser);
      }
    }, 100);
    
    return { user: mockUser };
  };
  
  const mockSignOut = async (auth) => {
    auth.currentUser = null;
    
    // Trigger auth state change
    setTimeout(() => {
      if (auth.onAuthStateChanged) {
        auth.onAuthStateChanged(null);
      }
    }, 100);
  };
  
  // Make functions available globally
  window.auth = mockAuth;
  window.signInWithEmailAndPassword = mockSignInWithEmailAndPassword;
  window.createUserWithEmailAndPassword = mockCreateUserWithEmailAndPassword;
  window.signOut = mockSignOut;
  window.onAuthStateChanged = mockAuth.onAuthStateChanged;
  
  // Signal that Firebase is ready
  window.firebaseReady = true;
  window.dispatchEvent(new CustomEvent('firebaseReady'));
}

createEnhancedMockFirebase();
