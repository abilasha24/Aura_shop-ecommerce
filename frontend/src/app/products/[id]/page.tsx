'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Loader2, MessageSquare, ShieldAlert, Award, RefreshCw, Send } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
  };
}

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
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  reviews: Review[];
}

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery
  const [selectedImage, setSelectedImage] = useState('');

  // Cart
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [addingToCart, setAddingToCart] = useState(false);

  // Review Form
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch product detail and recommendations
  const loadProductData = useCallback(async () => {
    try {
      const prodData = await apiRequest(`/products/${id}`);
      setProduct(prodData);
      if (prodData.images && prodData.images.length > 0) {
        setSelectedImage(prodData.images[0]);
      }

      // Fetch recommendations based on category
      const recsData = await apiRequest(`/products/recommendations?productId=${id}`);
      setRecommendations(recsData);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
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
        quantity,
        isAuthenticated
      );
      alert('Product successfully added to cart!');
    } catch (err: any) {
      alert(err.message || 'Could not add product to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || commentInput.length < 3) {
      setReviewError('Comment must be at least 3 characters.');
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(false);

    try {
      await apiRequest(`/products/${id}/reviews`, {
        method: 'POST',
        body: {
          rating: ratingInput,
          comment: commentInput,
        },
      });
      setReviewSuccess(true);
      setCommentInput('');
      setRatingInput(5);
      // Reload product to update ratings and reviews list
      await loadProductData();
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-brand-600" size={40} />
        <p className="text-sm font-semibold text-surface-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 max-w-lg mx-auto">
          <p className="text-sm font-semibold text-red-800">Error loading product: {error || 'Product not found.'}</p>
          <p className="text-xs text-red-600 mt-2">Please return to the store or check your connection.</p>
        </div>
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center px-6 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const discountPrice = product.discountPercent > 0
    ? product.price * (1 - product.discountPercent / 100)
    : product.price;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-16">
      {/* Product Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left Column: Images */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-surface-200 bg-white">
            <Image
              src={selectedImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative h-20 w-20 rounded-xl overflow-hidden border flex-shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-brand-600 ring-2 ring-brand-600/20'
                      : 'border-surface-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: details */}
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600">
            <Link href="/products" className="hover:underline">Shop</Link>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-surface-900 leading-tight">
              {product.name}
            </h1>
            
            {/* Ratings Summary */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-surface-700">{product.rating}</span>
              <span className="text-sm text-surface-400">({product.numReviews} ratings)</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="py-4 border-t border-b border-surface-200">
            {product.discountPercent > 0 ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-brand-600">${discountPrice.toFixed(2)}</span>
                  <span className="text-lg text-surface-400 line-through">${product.price.toFixed(2)}</span>
                  <span className="bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Save {product.discountPercent}%
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-3xl font-extrabold text-surface-900">${product.price.toFixed(2)}</span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-surface-400">Description</h3>
            <p className="text-sm text-surface-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Stock and Purchase controls */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-surface-700">
                {product.stock > 0 ? `In Stock (${product.stock} units available)` : 'Temporarily Out of Stock'}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                {/* Quantity input */}
                <div className="flex items-center border border-surface-200 rounded-xl bg-white h-12">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 text-lg font-semibold hover:text-brand-600 transition"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-surface-950">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 text-lg font-semibold hover:text-brand-600 transition"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 min-w-[200px] inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:hover:scale-100"
                >
                  {addingToCart ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <ShoppingCart size={18} />
                  )}
                  <span>Add to Shopping Cart</span>
                </button>
              </div>
            )}
          </div>

          {/* Extra selling arguments */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-surface-100 text-center">
            <div className="space-y-1">
              <Award size={20} className="mx-auto text-brand-500" />
              <p className="text-[10px] font-bold uppercase text-surface-400 mt-1">100% Original</p>
            </div>
            <div className="space-y-1">
              <RefreshCw size={20} className="mx-auto text-brand-500" />
              <p className="text-[10px] font-bold uppercase text-surface-400 mt-1">Easy Return</p>
            </div>
            <div className="space-y-1">
              <ShieldAlert size={20} className="mx-auto text-brand-500" />
              <p className="text-[10px] font-bold uppercase text-surface-400 mt-1">Genuine Warranty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Review Section */}
      <section className="border-t border-surface-200 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Write a Review Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold tracking-tight">Customer Feedback</h2>
              <p className="text-sm text-surface-500">Provide your review and rating for this product</p>
            </div>

            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4 p-6 border border-surface-200 bg-white rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-surface-900">Write a Review</h3>

                {reviewError && (
                  <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                    Review submitted successfully!
                  </div>
                )}

                {/* Rating selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-surface-400 uppercase">Your Rating</label>
                  <div className="flex items-center gap-1.5 text-amber-500">
                    {Array.from({ length: 5 }, (_, i) => {
                      const ratingVal = i + 1;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRatingInput(ratingVal)}
                          className="hover:scale-110 transition"
                        >
                          <Star
                            size={24}
                            fill={ratingVal <= ratingInput ? 'currentColor' : 'none'}
                            stroke="currentColor"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment area */}
                <div className="space-y-1.5">
                  <label htmlFor="comment" className="text-xs font-semibold text-surface-400 uppercase">Comments</label>
                  <textarea
                    id="comment"
                    rows={4}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Describe your experience with this item..."
                    className="w-full p-3 text-sm rounded-xl border border-surface-200 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full flex items-center justify-center gap-2 h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl transition"
                >
                  {submittingReview ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  <span>Post Review</span>
                </button>
              </form>
            ) : (
              <div className="p-6 border border-dashed border-surface-300 rounded-2xl text-center space-y-4 bg-surface-50/50">
                <MessageSquare size={36} className="mx-auto text-surface-400" />
                <div>
                  <p className="text-sm font-bold text-surface-800">Want to write a review?</p>
                  <p className="text-xs text-surface-500 mt-1">Please sign in to share your purchase reviews.</p>
                </div>
                <Link
                  href="/auth"
                  className="inline-flex h-9 items-center justify-center px-4 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition"
                >
                  Login / Register
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List Column */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-display text-xl font-bold tracking-tight">Recent Reviews ({product.reviews.length})</h3>
            
            {product.reviews.length === 0 ? (
              <div className="border border-surface-200 bg-white rounded-2xl p-12 text-center text-surface-500 text-sm">
                No reviews yet. Be the first to share your opinion!
              </div>
            ) : (
              <div className="space-y-4">
                {product.reviews.map((rev) => (
                  <div key={rev.id} className="p-5 border border-surface-200 bg-white rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-surface-900">{rev.user.name}</p>
                        <p className="text-[10px] text-surface-400 mt-0.5">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < rev.rating ? 'currentColor' : 'none'}
                            stroke="currentColor"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-surface-600 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recommended Products Carousel */}
      {recommendations.length > 0 && (
        <section className="border-t border-surface-200 pt-10 space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">You Might Also Like</h2>
            <p className="text-sm text-surface-500 mt-1">Recommended products in the same category</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.slice(0, 4).map((rec) => {
              const recDiscountPrice = rec.discountPercent > 0
                ? rec.price * (1 - rec.discountPercent / 100)
                : rec.price;

              return (
                <div key={rec.id} className="group card-hover-effect rounded-2xl border border-surface-200 bg-white overflow-hidden flex flex-col justify-between">
                  <div className="relative aspect-square w-full bg-surface-100 overflow-hidden">
                    <Link href={`/products/${rec.id}`} className="block w-full h-full">
                      <Image
                        src={rec.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                        alt={rec.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 20vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </Link>
                  </div>

                  <div className="p-4 space-y-3">
                    <Link href={`/products/${rec.id}`}>
                      <h4 className="font-display font-bold text-sm text-surface-900 hover:text-brand-600 transition truncate">
                        {rec.name}
                      </h4>
                    </Link>
                    <div className="flex items-center justify-between border-t border-surface-100 pt-2">
                      <div>
                        {rec.discountPercent > 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-surface-900">${recDiscountPrice.toFixed(2)}</span>
                            <span className="text-[10px] text-surface-400 line-through">${rec.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-surface-900">${rec.price.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                        <Star size={10} fill="currentColor" />
                        <span className="font-semibold text-surface-700">{rec.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
