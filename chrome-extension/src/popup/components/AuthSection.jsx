import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthSection = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(loginData.email, loginData.password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await register(registerData.name, registerData.email, registerData.password);
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-neutral mb-2">PromptInSTYL</h1>
        <p className="text-body">AI-powered prompt engineering assistant</p>
      </div>

      <div className="card">
        <div className="flex border-b border-body/20 mb-6">
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'login'
                ? 'text-accent border-b-2 border-accent'
                : 'text-body hover:text-neutral'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'register'
                ? 'text-accent border-b-2 border-accent'
                : 'text-body hover:text-neutral'
            }`}
            onClick={() => setActiveTab('register')}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent text-sm">
            {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral mb-1">
                Email
              </label>
              <input
                type="email"
                required
                className="input-field"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral mb-1">
                Email
              </label>
              <input
                type="email"
                required
                className="input-field"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                placeholder="Enter your password (min 6 characters)"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-body">
            Demo mode - any email/password will work
          </p>
          <button
            onClick={() => {
              setLoginData({ email: 'demo@example.com', password: 'demo123' });
              handleLogin({ preventDefault: () => {} });
            }}
            className="mt-2 text-sm text-accent hover:text-accent/80 underline"
          >
            Quick Demo Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthSection;
