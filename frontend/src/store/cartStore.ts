import { create } from 'zustand';
import { apiRequest } from '@/utils/api';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  discountPercent: number;
  images: string[];
  stock: number;
}

export interface CartItem {
  id: string; // DB cartItem id for authenticated, or productId for guest
  productId: string;
  quantity: number;
  variant: any;
  product: CartProduct;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  fetchCart: (isAuthenticated: boolean) => Promise<void>;
  addToCart: (product: CartProduct, quantity: number, isAuthenticated: boolean) => Promise<void>;
  updateQuantity: (id: string, quantity: number, isAuthenticated: boolean) => Promise<void>;
  removeFromCart: (id: string, isAuthenticated: boolean) => Promise<void>;
  syncCartWithServer: () => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchCart: async (isAuthenticated) => {
    set({ loading: true, error: null });
    if (isAuthenticated) {
      try {
        const data = await apiRequest('/cart');
        set({ items: data, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
      }
    } else {
      // Load guest cart from local storage
      const localCart = localStorage.getItem('guest_cart');
      const items = localCart ? JSON.parse(localCart) : [];
      set({ items, loading: false });
    }
  },

  addToCart: async (product, quantity, isAuthenticated) => {
    set({ error: null });
    if (isAuthenticated) {
      try {
        set({ loading: true });
        await apiRequest('/cart/add', {
          method: 'POST',
          body: { productId: product.id, quantity, variant: {} },
        });
        // Refetch cart from server to sync state
        const data = await apiRequest('/cart');
        set({ items: data, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        throw err;
      }
    } else {
      // Local cart logic
      const currentItems = get().items;
      const existingItemIndex = currentItems.findIndex((item) => item.productId === product.id);
      
      let newItems = [...currentItems];
      if (existingItemIndex > -1) {
        const newQty = newItems[existingItemIndex].quantity + quantity;
        if (product.stock < newQty) {
          throw new Error(`Insufficient stock. Only ${product.stock} available.`);
        }
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newQty,
        };
      } else {
        if (product.stock < quantity) {
          throw new Error(`Insufficient stock. Only ${product.stock} available.`);
        }
        newItems.push({
          id: product.id, // Use productId as temporary id for guest
          productId: product.id,
          quantity,
          variant: {},
          product,
        });
      }
      localStorage.setItem('guest_cart', JSON.stringify(newItems));
      set({ items: newItems });
    }
  },

  updateQuantity: async (id, quantity, isAuthenticated) => {
    set({ error: null });
    if (isAuthenticated) {
      try {
        set({ loading: true });
        await apiRequest(`/cart/update/${id}`, {
          method: 'PUT',
          body: { quantity },
        });
        const data = await apiRequest('/cart');
        set({ items: data, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        throw err;
      }
    } else {
      const currentItems = get().items;
      const newItems = currentItems.map((item) => {
        if (item.id === id) {
          if (item.product.stock < quantity) {
            throw new Error(`Insufficient stock. Only ${item.product.stock} available.`);
          }
          return { ...item, quantity };
        }
        return item;
      });
      localStorage.setItem('guest_cart', JSON.stringify(newItems));
      set({ items: newItems });
    }
  },

  removeFromCart: async (id, isAuthenticated) => {
    set({ error: null });
    if (isAuthenticated) {
      try {
        set({ loading: true });
        await apiRequest(`/cart/remove/${id}`, {
          method: 'DELETE',
        });
        const data = await apiRequest('/cart');
        set({ items: data, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        throw err;
      }
    } else {
      const currentItems = get().items;
      const newItems = currentItems.filter((item) => item.id !== id);
      localStorage.setItem('guest_cart', JSON.stringify(newItems));
      set({ items: newItems });
    }
  },

  syncCartWithServer: async () => {
    const localCart = localStorage.getItem('guest_cart');
    if (!localCart) return;

    try {
      const itemsToSync = JSON.parse(localCart).map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        variant: item.variant || {},
      }));

      if (itemsToSync.length > 0) {
        set({ loading: true, error: null });
        const synchronizedData = await apiRequest('/cart/sync', {
          method: 'POST',
          body: itemsToSync,
        });
        set({ items: synchronizedData, loading: false });
        localStorage.removeItem('guest_cart');
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  clearCart: () => {
    localStorage.removeItem('guest_cart');
    set({ items: [] });
  },
}));
