import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT secret key — loaded from environment variable, or falls back to a default.
// ⚠️ In production, always set JWT_SECRET in your .env file and never use the default!
const JWT_SECRET = process.env.JWT_SECRET || 'foodie_jwt_secret_key';

/**
 * Extended Request interface that includes the authenticated user's info.
 * After the authMiddleware runs, req.user will contain { id, role }
 * from the decoded JWT payload.
 */
export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

/**
 * Generates a signed JWT token for a user.
 *
 * @param userId - The MongoDB ObjectId of the user (as a string)
 * @param role   - The user's role ('customer', 'restaurant', or 'delivery')
 * @returns A signed JWT token string, valid for 7 days
 *
 * The token payload contains: { id: userId, role: role }
 * This token should be sent by the client in the Authorization header:
 *   Authorization: Bearer <token>
 */
export function generateToken(userId: string, role: string): string {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Express middleware to protect routes that require authentication.
 *
 * How it works:
 * 1. Reads the JWT token from the 'Authorization' header (format: "Bearer <token>")
 * 2. Verifies the token's signature and expiration using the JWT_SECRET
 * 3. Decodes the payload and attaches { id, role } to req.user
 * 4. Calls next() to allow the request to proceed to the route handler
 *
 * If the token is missing or invalid, responds with 401 Unauthorized.
 *
 * Usage in routes:
 *   router.get('/protected-route', authMiddleware, handlerFunction);
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Extract the token from the Authorization header
  // Expected format: "Bearer eyJhbGciOiJIUz..."
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // If no token is provided, deny access
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  try {
    // Verify and decode the token — throws an error if invalid or expired
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    // Attach the decoded user info to the request object
    // so downstream route handlers can access req.user.id and req.user.role
    req.user = decoded;

    // Token is valid — proceed to the next middleware/route handler
    next();
  } catch {
    // Token verification failed (expired, tampered, or malformed)
    res.status(401).json({ message: 'Token is not valid' });
  }
}
