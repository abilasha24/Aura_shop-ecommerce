import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  variant: z.any().optional(),
});

export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discountPercent: true,
            images: true,
            stock: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(cartItems);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const validatedData = cartItemSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.stock < validatedData.quantity) {
      return res.status(400).json({ message: `Insufficient product stock. Available: ${product.stock}` });
    }

    const variantJson = validatedData.variant ?? {};

    // Check if item already in cart with same variant
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId: validatedData.productId,
        variant: {
          equals: variantJson
        }
      }
    });

    let cartItem;
    if (existingItem) {
      const newQty = existingItem.quantity + validatedData.quantity;
      if (product.stock < newQty) {
        return res.status(400).json({ message: `Insufficient stock to add more. Available: ${product.stock}` });
      }
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId: validatedData.productId,
          quantity: validatedData.quantity,
          variant: variantJson,
        },
      });
    }

    return res.status(201).json(cartItem);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { id } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be a positive integer.' });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId },
      include: { product: true }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    if (cartItem.product.stock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Only ${cartItem.product.stock} available.` });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    return res.status(200).json(updatedItem);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const removeCartItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { id } = req.params;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId },
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Item removed from cart.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const syncCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const itemsSchema = z.array(cartItemSchema);
    const validatedItems = itemsSchema.parse(req.body);

    // Fetch and check all products in batch
    const productIds = validatedItems.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    
    const productMap = new Map(products.map(p => [p.id, p]));

    // Transaction to clear old and create new
    await prisma.$transaction(async (tx) => {
      // Clean existing cart
      await tx.cartItem.deleteMany({ where: { userId } });

      // Build cart records
      for (const item of validatedItems) {
        const prod = productMap.get(item.productId);
        if (!prod) continue; // Skip invalid products

        // Limit to available stock
        const finalQty = Math.min(item.quantity, prod.stock);
        if (finalQty <= 0) continue;

        await tx.cartItem.create({
          data: {
            userId,
            productId: item.productId,
            quantity: finalQty,
            variant: item.variant ?? {},
          }
        });
      }
    });

    const synchronizedCart = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discountPercent: true,
            images: true,
            stock: true,
          }
        }
      }
    });

    return res.status(200).json(synchronizedCart);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};
