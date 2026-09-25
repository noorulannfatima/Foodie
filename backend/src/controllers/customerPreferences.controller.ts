import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User, { CUSTOMER_LANGUAGES, CustomerLanguage, normalizeCustomerLanguage } from '../models/user';
import { claimPushToken, isExpoPushToken, releasePushToken } from '../services/push.service';

/** The notification switches the customer app exposes (email/sms aren't sent yet). */
const NOTIFICATION_KEYS = ['push', 'orderUpdates', 'promotions'] as const;
type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

function serialize(preferences: any) {
  const notifications = Object.fromEntries(
    NOTIFICATION_KEYS.map((key) => [key, preferences?.notifications?.[key] !== false])
  ) as Record<NotificationKey, boolean>;
  return { notifications, language: normalizeCustomerLanguage(preferences?.language) };
}

/**
 * GET /api/customer/preferences
 */
export async function getPreferences(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id).select('preferences').lean();
    if (!user) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }
    res.json(serialize(user.preferences));
  } catch (error) {
    console.error('Get customer preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PATCH /api/customer/preferences
 * Body: { notifications?: { push?, orderUpdates?, promotions? }, language? }
 */
export async function updatePreferences(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { notifications, language } = req.body ?? {};
    const updates: Record<string, boolean | CustomerLanguage> = {};

    if (notifications !== undefined) {
      if (typeof notifications !== 'object' || notifications === null) {
        res.status(400).json({ message: 'notifications must be an object' });
        return;
      }
      for (const [key, value] of Object.entries(notifications)) {
        if (!NOTIFICATION_KEYS.includes(key as NotificationKey)) {
          res.status(400).json({ message: `Unknown notification setting: ${key}` });
          return;
        }
        if (typeof value !== 'boolean') {
          res.status(400).json({ message: `${key} must be true or false` });
          return;
        }
        updates[`preferences.notifications.${key}`] = value;
      }
    }

    if (language !== undefined) {
      if (!CUSTOMER_LANGUAGES.includes(language)) {
        res.status(400).json({ message: `language must be one of ${CUSTOMER_LANGUAGES.join(', ')}` });
        return;
      }
      updates['preferences.language'] = language;
    }

    if (!Object.keys(updates).length) {
      res.status(400).json({ message: 'Nothing to update' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: updates },
      { returnDocument: 'after' }
    )
      .select('preferences')
      .lean();
    if (!user) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }
    res.json(serialize(user.preferences));
  } catch (error) {
    console.error('Update customer preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

function readPushToken(req: AuthRequest, res: Response): string | null {
  const { token } = (req.body ?? {}) as { token?: unknown };
  if (typeof token !== 'string' || !isExpoPushToken(token)) {
    res.status(400).json({ message: 'A valid Expo push token is required' });
    return null;
  }
  return token;
}

/**
 * POST /api/customer/push-token  { token }
 */
export async function registerPushToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = readPushToken(req, res);
    if (!token) return;
    if (!(await claimPushToken('customer', req.user!.id, token))) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }
    res.json({ registered: true });
  } catch (error) {
    console.error('Register customer push token error:', error);
    res.status(500).json({ message: 'Server error registering push token' });
  }
}

/**
 * DELETE /api/customer/push-token  { token }
 */
export async function unregisterPushToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = readPushToken(req, res);
    if (!token) return;
    await releasePushToken('customer', req.user!.id, token);
    res.json({ registered: false });
  } catch (error) {
    console.error('Unregister customer push token error:', error);
    res.status(500).json({ message: 'Server error removing push token' });
  }
}
