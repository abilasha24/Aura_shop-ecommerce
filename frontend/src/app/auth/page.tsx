'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, loading, error, clearError } = useAuthStore();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // Local validation errors
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to home page
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!email.trim() || !password) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (activeTab === 'login') {
      try {
        await login(email, password);
        setSuccessMsg(true);
        setTimeout(() => router.push('/'), 1000);
      } catch (err) {
        // Error is set in store
      }
    } else {
      if (!name.trim()) {
        setValidationError('Please provide your name.');
        return;
      }
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }

      try {
        await register(name, email, password);
        setSuccessMsg(true);
        setTimeout(() => router.push('/'), 1000);
      } catch (err) {
        // Error is set in store
      }
    }
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    clearError();
    setValidationError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24 animate-fade-in">
      <div className="rounded-3xl border border-surface-200 bg-white p-8 shadow-md space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-[-50px] right-[-50px] h-32 w-32 rounded-full bg-brand-500/10 blur-xl pointer-events-none" />

        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="font-display text-3xl font-extrabold tracking-tight text-brand-600">
            AURA<span className="text-surface-900 font-light">SHOP</span>
          </Link>
          <p className="text-xs text-surface-400 font-medium">
            {activeTab === 'login' ? 'Sign in to access your cart and reviews' : 'Create an account to start shopping'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-surface-100 p-1 border border-surface-200/50">
          <button
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login' ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register' ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Messages */}
        {validationError && (
          <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl">
            {validationError}
          </div>
        )}
        {error && (
          <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <p className="font-semibold">Authentication Successful!</p>
              <p className="text-xs text-emerald-600/80 mt-0.5">Redirecting you to the home catalog...</p>
            </div>
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-surface-400 uppercase">Full Name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-surface-400">
                  <UserIcon size={16} />
                </span>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-surface-200 bg-white focus:outline-none focus:border-brand-500 transition"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-surface-400 uppercase">Email Address</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-surface-400">
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-surface-200 bg-white focus:outline-none focus:border-brand-500 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-surface-400 uppercase">Password</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-surface-400">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-surface-200 bg-white focus:outline-none focus:border-brand-500 transition"
                required
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-surface-400 uppercase">Confirm Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-surface-400">
                  <Lock size={16} />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-surface-200 bg-white focus:outline-none focus:border-brand-500 transition"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-12 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl transition hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : activeTab === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Log In</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Register</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Notice */}
        <div className="pt-4 border-t border-surface-100 flex items-start gap-2 text-[10px] text-surface-400 leading-normal">
          <Sparkles size={14} className="flex-shrink-0 mt-0.5 text-brand-400 animate-pulse" />
          <span>
            Demo Credentials: Register a new account or log in with any custom details. Accounts are stored dynamically in the remote database!
          </span>
        </div>
      </div>
    </div>
  );
}
