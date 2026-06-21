import { prisma } from './utils/prisma.js';

async function main() {
    console.log('Seeding database...');

    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    const electronics = await prisma.category.create({
        data: { name: 'Electronics', slug: 'electronics' },
    });
    const clothing = await prisma.category.create({
        data: { name: 'Clothing', slug: 'clothing' },
    });
    const books = await prisma.category.create({
        data: { name: 'Books', slug: 'books' },
    });

    await prisma.product.createMany({
        data: [
            {
                name: 'Wireless Headphones',
                slug: 'wireless-headphones',
                description: 'Premium noise-cancelling wireless headphones',
                price: 99.99,
                stock: 50,
                images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
                categoryId: electronics.id,
                rating: 4.5,
                numReviews: 120,
                isFeatured: true,
                discountPercent: 10,
            },
            {
                name: 'Smartphone X Pro',
                slug: 'smartphone-x-pro',
                description: 'Latest flagship smartphone with AI camera',
                price: 799.99,
                stock: 30,
                images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
                categoryId: electronics.id,
                rating: 4.8,
                numReviews: 250,
                isFeatured: true,
                discountPercent: 5,
            },
            {
                name: 'Cotton T-Shirt',
                slug: 'cotton-t-shirt',
                description: 'Comfortable everyday cotton t-shirt',
                price: 19.99,
                stock: 100,
                images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
                categoryId: clothing.id,
                rating: 4.2,
                numReviews: 80,
                isFeatured: false,
                discountPercent: 0,
            },
            {
                name: 'JavaScript: The Good Parts',
                slug: 'javascript-the-good-parts',
                description: 'Classic programming book for JS developers',
                price: 29.99,
                stock: 75,
                images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'],
                categoryId: books.id,
                rating: 4.7,
                numReviews: 200,
                isFeatured: true,
                discountPercent: 15,
            },
        ],
    });

    console.log('Seed complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());