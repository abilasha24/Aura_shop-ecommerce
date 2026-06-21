'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag, ArrowRight, Loader2, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, loading, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Checkout Simulation States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleQtyChange = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(id);
    try {
      await updateQuantity(id, newQty, isAuthenticated);
    } catch (err: any) {
      alert(err.message || 'Could not update item quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setUpdatingId(id);
    try {
      await removeFromCart(id, isAuthenticated);
    } catch (err: any) {
      alert(err.message || 'Could not remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutModalOpen(true);
      clearCart();
    }, 1500);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const finalPrice = item.product.discountPercent > 0
      ? item.product.price * (1 - item.product.discountPercent / 100)
      : item.product.price;
    return sum + finalPrice * item.quantity;
  }, 0);

  const discountSavings = items.reduce((sum, item) => {
    if (item.product.discountPercent > 0) {
      const savingsPerItem = item.product.price * (item.product.discountPercent / 100);
      return sum + savingsPerItem * item.quantity;
    }
    return sum;
  }, 0);

  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10;
  const tax = subtotal * 0.08; // 8% sales tax
  const total = subtotal + shipping + tax;

  if (items.length === 0 && !checkoutModalOpen) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600 mx-auto">
          <ShoppingBag size={36} />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="font-display text-2xl font-bold tracking-tight text-surface-900">Your Shopping Cart is Empty</h2>
          <p className="text-sm text-surface-500">
            Looks like you haven't added any products to your cart yet. Explore our latest featured collections!
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center gap-2 px-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition hover:scale-105"
        >
          <span>Start Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8 relative">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-surface-900">Shopping Cart</h1>
        <p className="text-sm text-surface-500">
          Review your items and complete checkout
        </p>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-brand-600" size={32} />
          <p className="text-sm text-surface-500 font-semibold">Updating cart state...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
          
          {/* Cart items list */}
          <main className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const itemPrice = item.product.price;
              const hasDiscount = item.product.discountPercent > 0;
              const finalPrice = hasDiscount
                ? itemPrice * (1 - item.product.discountPercent / 100)
                : itemPrice;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl border border-surface-200 bg-white relative"
                >
                  {updatingId === item.id && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-10">
                      <Loader2 className="animate-spin text-brand-600" size={24} />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-surface-100 border border-surface-200 flex-shrink-0">
                    <Image
                      src={item.product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                      alt={item.product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                    <Link href={`/products/${item.product.id}`}>
                      <h3 className="font-display font-bold text-surface-900 hover:text-brand-600 transition truncate text-base">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider">
                      {item.product.stock > 0 ? 'In Stock' : 'Out of stock'}
                    </p>
                  </div>

                  {/* Quantity Modifier */}
                  <div className="flex items-center border border-surface-200 rounded-xl bg-white h-10">
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 text-sm font-bold hover:text-brand-600 disabled:opacity-30 transition"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-surface-950">{item.quantity}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-8 text-sm font-bold hover:text-brand-600 disabled:opacity-30 transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Price info */}
                  <div className="text-center sm:text-right min-w-[100px]">
                    <div className="flex flex-col sm:items-end justify-center">
                      {hasDiscount ? (
                        <>
                          <span className="text-base font-bold text-brand-600">
                            ${(finalPrice * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-xs text-surface-400 line-through">
                            ${(itemPrice * item.quantity).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-base font-bold text-surface-900">
                          ${(itemPrice * item.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove action */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-xl text-surface-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </main>

          {/* Order Summary sidebar */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-display text-lg font-bold text-surface-900 border-b border-surface-100 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2 text-sm text-surface-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-surface-900">${subtotal.toFixed(2)}</span>
                </div>
                {discountSavings > 0 && (
                  <div className="flex justify-between text-brand-600">
                    <span>Discount Savings</span>
                    <span>-${discountSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-medium text-surface-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span className="font-medium text-surface-900">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 p-3 rounded-xl text-[11px] text-brand-700 leading-normal">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>Add <strong>${(100 - subtotal).toFixed(2)}</strong> more to unlock Free Shipping!</span>
                </div>
              )}

              <div className="border-t border-surface-200 pt-4 flex justify-between items-baseline">
                <span className="text-base font-bold text-surface-900">Order Total</span>
                <span className="text-2xl font-extrabold text-brand-600">${total.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full flex items-center justify-center gap-2 h-12 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl transition hover:scale-[1.02] disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Processing order...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Mock Checkout Success Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="relative max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-scale-in border border-surface-150">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Sparkles size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-extrabold text-surface-900">Order Placed Successfully!</h2>
              <p className="text-sm text-surface-500 leading-relaxed">
                Thank you for your purchase! Since this is a demonstration project, your order has been simulated and processed locally. We've cleared your current cart.
              </p>
            </div>

            <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200 text-left space-y-1.5 text-xs text-surface-600">
              <div className="flex justify-between">
                <span>Transaction Ref:</span>
                <span className="font-semibold text-surface-900">TXN-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount Paid:</span>
                <span className="font-semibold text-emerald-600">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Status:</span>
                <span className="font-semibold text-brand-600">Preparing Dispatch</span>
              </div>
            </div>

            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
