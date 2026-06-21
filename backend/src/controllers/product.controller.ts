import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { cacheGet, cacheSet, cacheClearPrefix, cacheDel } from '../utils/redis.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(3),
});

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      sort = 'popular',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Create unique cache key based on query parameters
    const cacheKey = `product:list:${JSON.stringify(req.query)}`;
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Build Prisma query filter
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        slug: category as string,
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (rating) {
      where.rating = {
        gte: parseFloat(rating as string),
      };
    }

    // Sorting
    let orderBy: any = {};
    if (sort === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else {
      // popular (default) or best rating
      orderBy = [
        { rating: 'desc' },
        { numReviews: 'desc' }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { name: true, slug: true }
          }
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };

    // Cache results for 5 minutes
    await cacheSet(cacheKey, JSON.stringify(result), 300);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:detail:${id}`;
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Cache details for 10 minutes
    await cacheSet(cacheKey, JSON.stringify(product), 600);

    return res.status(200).json(product);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'product:categories';
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    await cacheSet(cacheKey, JSON.stringify(categories), 1200); // Cache for 20 mins

    return res.status(200).json(categories);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const addReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { id: productId } = req.params;
    const validatedData = reviewSchema.parse(req.body);

    // Verify user purchased this product before? Optional, let's allow review for simplicity but check product existence
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Create or update review
    await prisma.review.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      create: {
        userId,
        productId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
    });

    // Recompute product rating statistics
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const numReviews = reviews.length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        rating: parseFloat(avgRating.toFixed(1)),
        numReviews,
      },
    });

    // Clear caches
    await cacheClearPrefix('product:list');
    await cacheDel(`product:detail:${productId}`);

    return res.status(201).json({ message: 'Review saved successfully.', product: updatedProduct });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId as string },
        select: { categoryId: true },
      });

      if (product) {
        // Find other products in the same category, sorting by rating/popularity
        const recommendations = await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: productId as string },
          },
          take: 6,
          orderBy: [
            { rating: 'desc' },
            { numReviews: 'desc' }
          ],
        });
        return res.status(200).json(recommendations);
      }
    }

    // Default recommendation: featured or highly-rated products
    const recommendations = await prisma.product.findMany({
      where: { isFeatured: true },
      take: 6,
      orderBy: { rating: 'desc' },
    });

    return res.status(200).json(recommendations);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};
