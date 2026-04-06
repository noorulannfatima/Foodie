import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../../models/user';
import Restaurant from '../../models/restaurant';
import DeliveryPerson from '../../models/deliveryperson';
import { generateToken, AuthRequest } from '../middleware/auth';

// Helper to get the model based on role
function getModel(role: string): mongoose.Model<any> | null {
  switch (role) {
    case 'customer': return User;
    case 'restaurant': return Restaurant;
    case 'delivery': return DeliveryPerson;
    default: return null;
  }
}

// POST /auth/:role/signup
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const role = req.params.role as string;
    const Model = getModel(role);

    if (!Model) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const { email } = req.body;

    // Check if user already exists
    const existing = await Model.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'An account with this email already exists' });
      return;
    }

    // Create new user
    const user = await Model.create(req.body);

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
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ message: messages.join(', ') });
      return;
    }
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
}

// POST /auth/:role/login
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

    // Find user with password field included
    const user = await Model.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Compare password
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

// GET /auth/verify
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
