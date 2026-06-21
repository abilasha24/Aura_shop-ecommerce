'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, ShoppingCart, Loader2, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  discountPercent: number;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeatured() {
      try {
        // Fetch recommendations / featured products
        const data = await apiRequest('/products?limit=8');
        // Filter for featured products in client, or just use the backend list
        const featured = data.products.filter((p: Product) => p.isFeatured);
        // Fallback if none are marked featured
        setFeaturedProducts(featured.length > 0 ? featured : data.products.slice(0, 4));
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id);
    try {
      await addToCart(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          discountPercent: product.discountPercent,
          images: product.images,
          stock: product.stock,
        },
        1,
        isAuthenticated
      );
    } catch (err: any) {
      alert(err.message || 'Could not add item to cart');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-16 pb-16 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-950 py-24 sm:py-32">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-brand-500/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-2xl text-left space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-sm text-brand-300">
              <Sparkles size={16} />
              <span>Next Generation eCommerce</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Elevate Your Everyday <br />
              <span className="bg-gradient-to-r from-brand-300 to-violet-400 bg-clip-text text-transparent">
                Lifestyle & Tech
              </span>
            </h1>
            <p className="text-lg text-brand-100/80 leading-relaxed">
              Discover our carefully curated premium collections designed for modern builders, tech enthusiasts, and lifestyle aficionados. Enjoy 15% discount on your first order.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-medium h-12 px-8 transition-all hover:scale-105 shadow-lg shadow-brand-500/25"
              >
                <span>Shop Catalog</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/products?category=electronics"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium h-12 px-8 transition-all"
              >
                Explore Electronics
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 rounded-2xl border border-surface-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Free Express Delivery</h3>
              <p className="text-sm text-surface-500 mt-1">On all orders above $100. Fast dispatch assured.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Secure Payments</h3>
              <p className="text-sm text-surface-500 mt-1">256-bit encrypted checkout keeping data safe.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
              <Star size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Buyer Protection</h3>
              <p className="text-sm text-surface-500 mt-1">30 days easy returns policy for complete peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Shop by Category</h2>
              <p className="text-surface-500 mt-1">Explore curated products by category</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Category card 1 */}
            <Link
              href="/products?category=electronics"
              className="group relative overflow-hidden rounded-2xl bg-surface-900 h-64 shadow-md block transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              {/* Overlay graphics */}
              <div className="absolute inset-0 bg-brand-900/10 mix-blend-overlay group-hover:bg-brand-900/20 transition-colors" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                <span className="text-brand-300 text-xs font-bold uppercase tracking-wider">Device & Tech</span>
                <h3 className="font-display text-2xl font-bold text-white mt-1">Electronics</h3>
                <p className="text-sm text-brand-100/70 mt-2 opacity-0 group-hover:opacity-100 transition duration-300">
                  Headphones, smartphones & more &rarr;
                </p>
              </div>
            </Link>

            {/* Category card 2 */}
            <Link
              href="/products?category=clothing"
              className="group relative overflow-hidden rounded-2xl bg-brand-900 h-64 shadow-md block transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                <span className="text-brand-300 text-xs font-bold uppercase tracking-wider">Apparel</span>
                <h3 className="font-display text-2xl font-bold text-white mt-1">Clothing</h3>
                <p className="text-sm text-brand-100/70 mt-2 opacity-0 group-hover:opacity-100 transition duration-300">
                  Premium t-shirts, jackets & accessories &rarr;
                </p>
              </div>
            </Link>

            {/* Category card 3 */}
            <Link
              href="/products?category=books"
              className="group relative overflow-hidden rounded-2xl bg-violet-950 h-64 shadow-md block transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                <span className="text-brand-300 text-xs font-bold uppercase tracking-wider">Education</span>
                <h3 className="font-display text-2xl font-bold text-white mt-1">Books</h3>
                <p className="text-sm text-brand-100/70 mt-2 opacity-0 group-hover:opacity-100 transition duration-300">
                  Programming guides & best-selling non-fiction &rarr;
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Featured Products</h2>
              <p className="text-surface-500 mt-1">Handpicked premium options for you</p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition"
            >
              <span>See all products</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-brand-600" size={32} />
              <p className="text-sm text-surface-500 font-medium">Fetching featured catalog...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center max-w-lg mx-auto">
              <p className="text-sm font-medium text-red-800">Unable to load catalog: {error}</p>
              <p className="text-xs text-red-600 mt-2">Is the API server running at http://localhost:5000?</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => {
                const discountPrice = product.discountPercent > 0
                  ? product.price * (1 - product.discountPercent / 100)
                  : product.price;

                return (
                  <div key={product.id} className="group card-hover-effect rounded-2xl border border-surface-200 bg-white overflow-hidden flex flex-col justify-between">
                    <div className="relative aspect-square w-full bg-surface-100 overflow-hidden">
                      {product.discountPercent > 0 && (
                        <span className="absolute top-3 left-3 bg-brand-600 text-white font-bold text-[10px] uppercase px-2 py-1 rounded-full z-10 shadow-sm">
                          -{product.discountPercent}% Off
                        </span>
                      )}
                      
                      <Link href={`/products/${product.id}`} className="block w-full h-full">
                        <Image
                          src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      </Link>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                        <Link href={`/products/${product.id}`}>
                          <h3 className="font-display font-bold text-surface-900 mt-1 hover:text-brand-600 transition truncate">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-surface-500 mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-100">
                        <div>
                          {product.discountPercent > 0 ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-bold text-surface-900">${discountPrice.toFixed(2)}</span>
                              <span className="text-xs text-surface-400 line-through">${product.price.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-base font-bold text-surface-900">${product.price.toFixed(2)}</span>
                          )}
                          <div className="flex items-center gap-1 mt-1 text-amber-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-semibold text-surface-700">{product.rating}</span>
                            <span className="text-[10px] text-surface-400">({product.numReviews})</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock <= 0 || addingId === product.id}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Add to Cart"
                        >
                          {addingId === product.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <ShoppingCart size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
