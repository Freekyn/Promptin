import React, { useState, useEffect } from 'react';
import AuthSection from './components/AuthSection';
import MainContent from './components/MainContent';
import UserBar from './components/UserBar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApiProvider } from './contexts/ApiContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <>
          <UserBar />
          <MainContent />
        </>
      ) : (
        <AuthSection />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ApiProvider>
        <AppContent />
      </ApiProvider>
    </AuthProvider>
  );
}

export default App;
