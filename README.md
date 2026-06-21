# 🛍️ AuraShop — Full Stack E-Commerce Platform

A production-level e-commerce web application built with modern technologies.

## 🚀 Live Demo
- Frontend: Coming soon (Vercel)
- Backend API: Coming soon (Railway)

## 🛠️ Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)

**Backend**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL (Neon Cloud)
- JWT Authentication
- Redis Cache (Memory Fallback)

## ✨ Features
- User Authentication (Register/Login)
- Product Listing with Search & Filters
- Category Browsing
- Product Detail Pages
- Shopping Cart
- Order Summary with Discounts
- Responsive Design

## 🏃 Getting Started

### Backend
\```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
\```

### Frontend
\```bash
cd frontend
npm install
npm run dev
\```

## 🌐 API Endpoints
- `POST /auth/register` — Register user
- `POST /auth/login` — Login user
- `GET /products` — Get all products
- `GET /products/:id` — Get product detail
- `GET /cart` — Get cart (auth required)
- `POST /cart/add` — Add to cart (auth required)