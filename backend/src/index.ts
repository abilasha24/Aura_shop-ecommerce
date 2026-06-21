import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { register, login, getProfile, updateProfile, getAddresses, addAddress, updateAddress, deleteAddress } from './controllers/auth.controller.js';
import { getProducts, getProductById, getCategories, addReview, getRecommendations } from './controllers/product.controller.js';
import { getCart, addToCart, updateCartItem, removeCartItem, syncCart } from './controllers/cart.controller.js';
import { requireAuth } from './middleware/auth.middleware.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Ecommerce API is running!', status: 'OK' });
});

// Auth routes
app.post('/auth/register', register);
app.post('/auth/login', login);
app.get('/auth/profile', requireAuth, getProfile);
app.put('/auth/profile', requireAuth, updateProfile);
app.get('/auth/addresses', requireAuth, getAddresses);
app.post('/auth/addresses', requireAuth, addAddress);
app.put('/auth/addresses/:addressId', requireAuth, updateAddress);
app.delete('/auth/addresses/:addressId', requireAuth, deleteAddress);

// Product routes
app.get('/products', getProducts);
app.get('/products/categories', getCategories);
app.get('/products/recommendations', getRecommendations);
app.get('/products/:id', getProductById);
app.post('/products/:id/reviews', requireAuth, addReview);

// Cart routes
app.get('/cart', requireAuth, getCart);
app.post('/cart/add', requireAuth, addToCart);
app.put('/cart/update/:id', requireAuth, updateCartItem);
app.delete('/cart/remove/:id', requireAuth, removeCartItem);
app.post('/cart/sync', requireAuth, syncCart);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export default app;