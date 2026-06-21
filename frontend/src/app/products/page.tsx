'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Loader2, Star, ShoppingCart, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  discountPercent: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter States
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination details
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filter values
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'popular');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Cart actions
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [addingId, setAddingId] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiRequest('/products/categories');
        setCategories(data);
        setCategoriesLoading(false);
      } catch (err) {
        console.error('Failed to load categories', err);
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Update query state when URL searchParams change
  useEffect(() => {
    setSearchVal(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSort(searchParams.get('sort') || 'popular');
    setCurrentPage(parseInt(searchParams.get('page') || '1'));
  }, [searchParams]);

  // Main fetch products function
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParts: string[] = [];
      queryParts.push(`page=${currentPage}`);
      queryParts.push('limit=12');
      if (searchVal) queryParts.push(`search=${encodeURIComponent(searchVal)}`);
      if (selectedCategory) queryParts.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (minPrice) queryParts.push(`minPrice=${minPrice}`);
      if (maxPrice) queryParts.push(`maxPrice=${maxPrice}`);
      if (sort) queryParts.push(`sort=${sort}`);

      const url = `/products?${queryParts.join('&')}`;
      const data = await apiRequest(url);
      
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.total);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products.');
      setLoading(false);
    }
  }, [currentPage, searchVal, selectedCategory, minPrice, maxPrice, sort]);

  // Trigger fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Push filter modifications to URL query
  const updateUrl = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Set or delete params
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });

    // Reset to page 1 for any search/filter modifications
    if (!updates.hasOwnProperty('page')) {
      params.set('page', '1');
    }

    router.push(`/products?${params.toString()}`);
  }, [searchParams, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: searchVal });
  };

  const handleCategorySelect = (categorySlug: string) => {
    updateUrl({ category: categorySlug });
  };

  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ minPrice, maxPrice });
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('popular');
    router.push('/products');
  };

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Title Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-surface-900">Explore Catalog</h1>
        <p className="text-sm text-surface-500">
          Showing {products.length} of {totalProducts} premium products
        </p>
      </div>

      {/* Control panel (Filters trigger, sorting, search) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-surface-200 pb-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md flex items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full h-11 px-4 pr-10 text-sm rounded-xl border border-surface-200 bg-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
          <button type="submit" className="absolute right-3 text-surface-400 hover:text-brand-500">
            <Search size={18} />
          </button>
        </form>

        {/* Buttons */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-2 h-11 px-4 text-sm font-medium border border-surface-200 rounded-xl hover:bg-surface-50 transition"
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown size={16} className="text-surface-400" />
            <select
              value={sort}
              onChange={(e) => updateUrl({ sort: e.target.value })}
              className="h-11 px-3 text-sm font-medium border border-surface-200 rounded-xl bg-white focus:outline-none focus:border-brand-500 transition"
            >
              <option value="popular">Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 items-start">
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden lg:block space-y-6 sticky top-24">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-brand-600" />
              <span>Filters</span>
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-xs text-brand-600 hover:underline font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-surface-400">Categories</h4>
            {categoriesLoading ? (
              <Loader2 className="animate-spin text-brand-600" size={16} />
            ) : (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`text-left text-sm py-2 px-3 rounded-xl transition ${
                    selectedCategory === ''
                      ? 'bg-brand-50 text-brand-600 font-semibold'
                      : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`text-left text-sm py-2 px-3 rounded-xl transition ${
                      selectedCategory === cat.slug
                        ? 'bg-brand-50 text-brand-600 font-semibold'
                        : 'text-surface-600 hover:bg-surface-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="space-y-3 pt-4 border-t border-surface-200">
            <h4 className="text-sm font-bold uppercase tracking-wider text-surface-400">Price Range ($)</h4>
            <form onSubmit={handlePriceFilterSubmit} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-surface-200 bg-white focus:outline-none"
                />
                <span className="text-surface-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-surface-200 bg-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition font-medium text-sm rounded-lg"
              >
                Apply
              </button>
            </form>
          </div>
        </aside>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-6 shadow-xl animate-scale-in">
              <div className="flex items-center justify-between pb-4 border-b border-surface-200">
                <h2 className="text-lg font-bold text-surface-900">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)} className="text-surface-500">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 mt-6">
                <button
                  onClick={() => {
                    handleClearFilters();
                    setShowMobileFilters(false);
                  }}
                  className="w-full text-center text-xs font-semibold py-2 text-red-500 bg-red-50 rounded-xl"
                >
                  Clear All
                </button>

                {/* Categories */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400">Categories</h4>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        handleCategorySelect('');
                        setShowMobileFilters(false);
                      }}
                      className={`text-left text-sm py-2 px-3 rounded-xl transition ${
                        selectedCategory === ''
                          ? 'bg-brand-50 text-brand-600 font-semibold'
                          : 'text-surface-600 hover:bg-surface-100'
                      }`}
                    >
                      All Products
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          handleCategorySelect(cat.slug);
                          setShowMobileFilters(false);
                        }}
                        className={`text-left text-sm py-2 px-3 rounded-xl transition ${
                          selectedCategory === cat.slug
                            ? 'bg-brand-50 text-brand-600 font-semibold'
                            : 'text-surface-600 hover:bg-surface-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="space-y-3 pt-4 border-t border-surface-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400">Price Range ($)</h4>
                  <form
                    onSubmit={(e) => {
                      handlePriceFilterSubmit(e);
                      setShowMobileFilters(false);
                    }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-surface-200"
                      />
                      <span className="text-surface-400">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-surface-200"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full h-10 bg-brand-600 text-white font-medium text-sm rounded-lg"
                    >
                      Apply
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="animate-spin text-brand-600" size={36} />
              <p className="text-sm text-surface-500 font-semibold">Filtering products catalog...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-12 text-center max-w-lg mx-auto">
              <p className="text-sm font-semibold text-red-800">Connection error: {error}</p>
              <p className="text-xs text-red-600 mt-2">Is the API server listening on http://localhost:5000?</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-surface-200 bg-white p-16 text-center">
              <p className="text-lg font-bold text-surface-900">No products found</p>
              <p className="text-sm text-surface-500 mt-2">Try adjusting your filters or typing a different search query.</p>
              <button
                onClick={handleClearFilters}
                className="mt-6 inline-flex h-11 items-center justify-center px-6 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Product Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const discountPrice = product.discountPercent > 0
                    ? product.price * (1 - product.discountPercent / 100)
                    : product.price;

                  return (
                    <div key={product.id} className="group card-hover-effect rounded-2xl border border-surface-200 bg-white overflow-hidden flex flex-col justify-between">
                      <div className="relative aspect-square w-full bg-surface-100 overflow-hidden">
                        {product.discountPercent > 0 && (
                          <span className="absolute top-3 left-3 bg-brand-600 text-white font-bold text-[10px] uppercase px-2 py-1 rounded-full z-10">
                            -{product.discountPercent}% Off
                          </span>
                        )}
                        <Link href={`/products/${product.id}`} className="block w-full h-full">
                          <Image
                            src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 30vw"
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
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-55 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition disabled:opacity-50"
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

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-surface-200">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => updateUrl({ page: currentPage - 1 })}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-50 transition disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateUrl({ page: pageNum })}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition ${
                          currentPage === pageNum
                            ? 'bg-brand-600 text-white'
                            : 'border border-surface-200 text-surface-600 hover:bg-surface-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => updateUrl({ page: currentPage + 1 })}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-50 transition disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-brand-600" size={36} />
        <p className="text-sm text-surface-500 font-semibold">Loading catalog...</p>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
