import { Request, Response } from 'express';
import mongoose from 'mongoose';

// ✅ Imports from the models directory
import User from '../models/user';
import Restaurant from '../models/restaurant';
import DeliveryPerson from '../models/deliveryperson';
import { generateToken, AuthRequest } from '../middleware/auth';

/**
 * Helper function to select the correct Mongoose model based on the user role.
 * 
 * @param role - 'customer', 'restaurant', or 'delivery'
 */
function getModel(role: string): mongoose.Model<any> | null {
  switch (role) {
    case 'customer':
      return User;
    case 'restaurant':
      return Restaurant;
    case 'delivery':
      return DeliveryPerson;
    default:
      return null;
  }
}

/**
 * POST /auth/:role/signup
 * 
 * Creates a new user account for the given role.
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const role = req.params.role as string;
    const Model = getModel(role);

    if (!Model) {
      res.status(400).json({ message: 'Invalid role. Use: customer, restaurant, or delivery' });
      return;
    }

    const { name, email, password } = req.body;

    // Manual validation for better error messages
    if (!name || !email || !password) {
      res.status(400).json({
        message: 'Missing required fields: name, email, and password are required',
      });
      return;
    }

    // Check for existing email in THIS model
    const existing = await Model.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'An account with this email already exists' });
      return;
    }

    // Create the document (password hashing is handled in model pre-save hooks)
    const user = await Model.create(req.body);

    // Generate response token
    const token = generateToken(String(user._id), role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ message: messages.join(', ') });
      return;
    }

    // Handle Mongo duplicate key error (if validation missed it)
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email address already in use' });
      return;
    }

    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
}

/**
 * POST /auth/:role/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const role = req.params.role as string;
    const Model = getModel(role);

    if (!Model) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    // .select('+password') is required because password is hidden by default in the schema
    const user = await Model.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // comparePassword is an instance method defined in the model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = generateToken(String(user._id), role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
}

/**
 * GET /auth/verify
 * 
 * Protected by authMiddleware, returns current user info.
 */
export async function verifyToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id, role } = req.user!;
    const Model = getModel(role);

    if (!Model) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const user = await Model.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}