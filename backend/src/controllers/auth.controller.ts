import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ✅ Imports from the models directory
import User from '../models/user';
import Restaurant from '../models/restaurant';
import DeliveryPerson from '../models/deliveryperson';
import Admin from '../models/admin';
import PasswordReset from '../models/passwordReset';
import { generateToken, AuthRequest } from '../middleware/auth';

// How long a password reset code stays valid, and how many wrong guesses are allowed.
const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RESET_MAX_ATTEMPTS = 5;

/**
 * Helper function to select the correct Mongoose model based on the user role.
 * 
 * @param role - 'customer', 'restaurant', 'delivery', or 'admin'
 */
function getModel(role: string): mongoose.Model<any> | null {
  switch (role) {
    case 'customer':
      return User;
    case 'restaurant':
      return Restaurant;
    case 'delivery':
      return DeliveryPerson;
    case 'admin':
      return Admin;
    default:
      return null;
  }
}

/**
 * Admins can log in but are only created by `npm run create:admin`, and their
 * password can't be reset through the (dev-logged) reset-code flow.
 * Returns true after sending a 403 so the caller can bail out.
 */
function rejectAdminSelfService(req: Request, res: Response): boolean {
  if (req.params.role !== 'admin') return false;
  res.status(403).json({ message: 'Not available for admin accounts' });
  return true;
}

/**
 * POST /auth/:role/signup
 * 
 * Creates a new user account for the given role.
 */
export async function signup(req: Request, res: Response): Promise<void> {
  if (rejectAdminSelfService(req, res)) return;
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

/**
 * POST /auth/:role/forgot-password
 *
 * Generates a 6-digit reset code for the account, stores a hashed copy with a
 * short expiry, and (in production) would email it to the user.
 *
 * The response is intentionally generic regardless of whether the email exists,
 * so attackers can't use it to discover which emails are registered.
 *
 * ⚠️ DEV ONLY: the plain code is also returned as `devCode` so the flow can be
 * tested without an email provider. Remove `devCode` once SMTP/SMS is wired up.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  if (rejectAdminSelfService(req, res)) return;
  try {
    const role = req.params.role as string;
    const Model = getModel(role);

    if (!Model) {
      res.status(400).json({ message: 'Invalid role. Use: customer, restaurant, or delivery' });
      return;
    }

    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Please provide an email address' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const genericMessage =
      'If an account exists for this email, a password reset code has been sent.';

    const user = await Model.findOne({ email: normalizedEmail });

    // Don't reveal whether the account exists.
    if (!user) {
      res.json({ message: genericMessage });
      return;
    }

    // 6-digit numeric code, zero-padded (e.g. "048392").
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    // Only one active reset code per account at a time.
    await PasswordReset.deleteMany({ email: normalizedEmail, role });
    await PasswordReset.create({
      email: normalizedEmail,
      role,
      codeHash,
      expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
    });

    // TODO: send `code` via email/SMS here. For now we log it server-side.
    console.log(`[forgot-password] Reset code for ${normalizedEmail} (${role}): ${code}`);

    res.json({ message: genericMessage, devCode: code });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
}

/**
 * POST /auth/:role/reset-password
 *
 * Verifies the reset code and sets a new password. The model's pre-save hook
 * re-hashes the password, so we just assign the plain value and save.
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  if (rejectAdminSelfService(req, res)) return;
  try {
    const role = req.params.role as string;
    const Model = getModel(role);

    if (!Model) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ message: 'Email, code, and new password are required' });
      return;
    }

    if (String(newPassword).length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters long' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const record = await PasswordReset.findOne({ email: normalizedEmail, role });

    if (!record) {
      res.status(400).json({ message: 'Invalid or expired reset code' });
      return;
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await record.deleteOne();
      res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
      return;
    }

    const isMatch = await bcrypt.compare(String(code), record.codeHash);
    if (!isMatch) {
      record.attempts += 1;
      if (record.attempts >= RESET_MAX_ATTEMPTS) {
        await record.deleteOne();
        res
          .status(400)
          .json({ message: 'Too many incorrect attempts. Please request a new reset code.' });
        return;
      }
      await record.save();
      res.status(400).json({ message: 'Invalid reset code' });
      return;
    }

    const user = await Model.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      await record.deleteOne();
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Assigning the plain password triggers the model's pre-save hashing hook.
    user.password = String(newPassword);
    await user.save();

    // Reset code is single-use.
    await record.deleteOne();

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ message: messages.join(', ') });
      return;
    }
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
}