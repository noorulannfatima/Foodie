import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function requireRole(...allowed: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      res.status(403).json({ message: 'Access denied for this role' });
      return;
    }
    next();
  };
}
