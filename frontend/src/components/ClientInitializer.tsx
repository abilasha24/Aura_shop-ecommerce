'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export default function ClientInitializer({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncCartWithServer = useCartStore((state) => state.syncCartWithServer);

  // Initialize Auth
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync and fetch cart when auth status changes
  useEffect(() => {
    const syncAndFetch = async () => {
      if (isAuthenticated) {
        await syncCartWithServer();
      }
      fetchCart(isAuthenticated);
    };
    
    syncAndFetch();
  }, [isAuthenticated, fetchCart, syncCartWithServer]);

  return <>{children}</>;
}
