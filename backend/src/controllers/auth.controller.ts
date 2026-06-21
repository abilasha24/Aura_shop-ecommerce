import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_signkey_2026_premium_ecommerce';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: 'USER', // Default role
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isPasswordMatch = await bcrypt.compare(validatedData.password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        addresses: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, email, password } = req.body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email already in use.' });
      }
      dataToUpdate.email = email;
    }
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const getAddresses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(addresses);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const addAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const validatedData = addressSchema.parse(req.body);

    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        ...validatedData,
        userId,
        isDefault: validatedData.isDefault ?? false,
      },
    });

    return res.status(201).json(newAddress);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const updateAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { addressId } = req.params;
    const validatedData = addressSchema.parse(req.body);

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found or unauthorized.' });
    }

    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: validatedData,
    });

    return res.status(200).json(updatedAddress);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { addressId } = req.params;

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found or unauthorized.' });
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return res.status(200).json({ message: 'Address deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};
