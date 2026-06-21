import { create } from 'zustand';
import { apiRequest } from '@/utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      localStorage.setItem('ecommerce_token', data.token);
      localStorage.setItem('ecommerce_user', JSON.stringify(data.user));
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      localStorage.setItem('ecommerce_token', data.token);
      localStorage.setItem('ecommerce_user', JSON.stringify(data.user));
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('ecommerce_token');
    localStorage.removeItem('ecommerce_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  initializeAuth: async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('ecommerce_token');
    const userStr = localStorage.getItem('ecommerce_user');
    
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true });
        // Optionally sync state from server
        const profile = await apiRequest('/auth/profile');
        localStorage.setItem('ecommerce_user', JSON.stringify(profile));
        set({ user: profile });
      } catch (err) {
        // Token might have expired
        localStorage.removeItem('ecommerce_token');
        localStorage.removeItem('ecommerce_user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },

  clearError: () => set({ error: null }),
}));
