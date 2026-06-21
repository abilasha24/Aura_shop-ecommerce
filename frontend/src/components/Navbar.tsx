'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingBag, User as UserIcon, LogOut, Search, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync search input with URL search parameter if present
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/products');
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 w-full glass shadow-sm transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight text-brand-600 hover:text-brand-700 transition">
              AURA<span className="text-surface-900 font-light">SHOP</span>
            </Link>
          </div>

          {/* Search bar (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex relative flex-1 max-w-md items-center">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 pr-10 text-sm rounded-full border border-surface-200 bg-white/50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            <button type="submit" className="absolute right-3 text-surface-400 hover:text-brand-500 transition">
              <Search size={18} />
            </button>
          </form>

          {/* Desktop Navigation Items */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-surface-900 hover:text-brand-600 transition">
              Home
            </Link>
            <Link href="/products" className="text-sm font-medium text-surface-900 hover:text-brand-600 transition">
              Shop
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-surface-900 hover:text-brand-600 transition-colors">
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="hidden sm:flex items-center gap-4 border-l border-surface-200 pl-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-surface-900 truncate max-w-[100px]">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-surface-400 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-surface-900 hover:text-brand-600 transition-colors border-l border-surface-200 pl-4"
              >
                <UserIcon size={20} />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-surface-900 hover:text-brand-600 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass border-t border-surface-200/50 px-4 py-4 space-y-4">
          {/* Search bar (Mobile) */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 pr-10 text-sm rounded-full border border-surface-200 bg-white focus:outline-none focus:border-brand-500 transition-all"
            />
            <button type="submit" className="absolute right-3 text-surface-400">
              <Search size={18} />
            </button>
          </form>

          <div className="flex flex-col gap-3 font-medium">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm py-2 px-3 hover:bg-brand-50 hover:text-brand-600 rounded-md transition"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm py-2 px-3 hover:bg-brand-50 hover:text-brand-600 rounded-md transition"
            >
              Shop
            </Link>
            {isAuthenticated && user ? (
              <div className="border-t border-surface-200/50 pt-3 px-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-surface-900">{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 border border-red-200 rounded-md bg-red-50/50 hover:bg-red-50 transition"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm py-2 px-3 hover:bg-brand-50 hover:text-brand-600 rounded-md transition border-t border-surface-200/50 pt-3"
              >
                <UserIcon size={18} />
                <span>Login / Register</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
