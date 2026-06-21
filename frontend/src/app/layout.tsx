import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Suspense } from 'react';
import ClientInitializer from '@/components/ClientInitializer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AuraShop - Premium eCommerce Experience',
  description: 'Explore the finest electronics, clothing, and books with instant checkout, search filters, and smooth animations.',
  metadataBase: new URL('http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} antialiased`}>
      <body className="flex flex-col min-h-screen bg-surface-50 text-surface-900">
        <ClientInitializer>
          <Suspense fallback={<div className="h-16 bg-white border-b border-surface-200" />}>
            <Navbar />
          </Suspense>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="border-t border-surface-200 bg-white/70 backdrop-blur-md py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-display text-lg font-bold text-brand-600 mb-3">AURA SHOP</h3>
                  <p className="text-sm text-surface-500 leading-relaxed max-w-xs">
                    Crafting premium shopping experiences with curated collections, exceptional products, and reliable services.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-surface-900 mb-3">Explore</h4>
                  <ul className="space-y-2 text-sm text-surface-500">
                    <li><a href="/" className="hover:text-brand-600 transition">Home</a></li>
                    <li><a href="/products" className="hover:text-brand-600 transition">Shop All</a></li>
                    <li><a href="/products?category=electronics" className="hover:text-brand-600 transition">Electronics</a></li>
                    <li><a href="/products?category=clothing" className="hover:text-brand-600 transition">Clothing</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-surface-900 mb-3">Customer Service</h4>
                  <p className="text-sm text-surface-500 leading-relaxed">
                    Need help? Contact our support team or browse our FAQs.
                  </p>
                  <p className="text-sm font-medium text-brand-600 mt-2">support@aurashop.com</p>
                </div>
              </div>
              <div className="border-t border-surface-100 mt-8 pt-6 text-center text-xs text-surface-400">
                &copy; {new Date().getFullYear()} AURA Shop. All rights reserved. Built with Next.js 14 and Tailwind.
              </div>
            </div>
          </footer>
        </ClientInitializer>
      </body>
    </html>
  );
}
