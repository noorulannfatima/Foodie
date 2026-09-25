import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User, { IUser } from '../models/user';

const MAX_ADDRESSES = 10;

/** Editable address fields and their length limits. */
const FIELDS = {
  label: 30,
  streetAddress: 200,
  city: 80,
  zipCode: 20,
  instructions: 200,
} as const;
type Field = keyof typeof FIELDS;
const REQUIRED: Field[] = ['streetAddress', 'city', 'zipCode'];

type SavedAddress = IUser['savedAddresses'][number];

function serialize(addr: SavedAddress) {
  return {
    _id: addr._id!.toString(),
    label: addr.label,
    streetAddress: addr.streetAddress,
    city: addr.city,
    zipCode: addr.zipCode,
    instructions: addr.instructions || undefined,
    isDefault: addr.isDefault,
  };
}

/** Newest first; on a timestamp tie the later array entry is newer. */
function newestFirst(addresses: SavedAddress[]) {
  return addresses
    .map((addr, index) => ({ addr, index }))
    .sort((a, b) => new Date(b.addr.createdAt).getTime() - new Date(a.addr.createdAt).getTime() || b.index - a.index)
    .map(({ addr }) => addr);
}

/** Default first, then newest first. */
function sendAddresses(res: Response, user: IUser, status = 200) {
  const addresses = newestFirst(user.savedAddresses).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  res.status(status).json({ addresses: addresses.map(serialize) });
}

/**
 * Validates and trims the address fields in `body`. With `partial`, missing
 * required fields are allowed (PATCH). Returns an error message or the fields.
 */
function readFields(body: any, partial: boolean): string | Partial<Record<Field, string>> {
  const fields: Partial<Record<Field, string>> = {};
  for (const [key, max] of Object.entries(FIELDS) as [Field, number][]) {
    const value = body?.[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') return `${key} must be text`;
    const trimmed = value.trim();
    if (trimmed.length > max) return `${key} cannot exceed ${max} characters`;
    fields[key] = trimmed;
  }
  for (const key of REQUIRED) {
    if (fields[key] === '' || (!partial && fields[key] === undefined)) return `${key} is required`;
  }
  if (fields.label === '') return 'label cannot be empty';
  return fields;
}

function sameAddress(addr: SavedAddress, fields: Partial<Record<Field, string>>) {
  const norm = (v?: string) => (v ?? '').trim().toLowerCase();
  return (
    norm(addr.streetAddress) === norm(fields.streetAddress) &&
    norm(addr.city) === norm(fields.city) &&
    norm(addr.zipCode) === norm(fields.zipCode)
  );
}

function findAddress(user: IUser, id: string) {
  return user.savedAddresses.find((addr) => addr._id!.toString() === id);
}

async function loadCustomer(req: AuthRequest, res: Response): Promise<IUser | null> {
  const user = await User.findById(req.user!.id);
  if (!user) res.status(404).json({ message: 'Account not found' });
  return user;
}

/**
 * GET /api/customer/addresses
 */
export async function listAddresses(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await loadCustomer(req, res);
    if (user) sendAddresses(res, user);
  } catch (error) {
    console.error('List addresses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/customer/addresses
 * Body: { label?, streetAddress, city, zipCode, instructions?, isDefault? }
 * Saving an address that is already saved (same street, city, zip) returns
 * the list unchanged, so checkout can offer "save" without making duplicates.
 */
export async function addAddress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const fields = readFields(req.body, false);
    if (typeof fields === 'string') {
      res.status(400).json({ message: fields });
      return;
    }
    const user = await loadCustomer(req, res);
    if (!user) return;

    if (user.savedAddresses.some((addr) => sameAddress(addr, fields))) {
      sendAddresses(res, user);
      return;
    }
    if (user.savedAddresses.length >= MAX_ADDRESSES) {
      res.status(400).json({ message: `You can save up to ${MAX_ADDRESSES} addresses` });
      return;
    }

    const makeDefault = req.body?.isDefault === true || user.savedAddresses.length === 0;
    if (makeDefault) user.savedAddresses.forEach((addr) => (addr.isDefault = false));
    user.savedAddresses.push({
      ...fields,
      instructions: fields.instructions || undefined,
      isDefault: makeDefault,
      createdAt: new Date(),
    } as SavedAddress);
    await user.save();
    sendAddresses(res, user, 201);
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PATCH /api/customer/addresses/:id
 * Body: any of { label, streetAddress, city, zipCode, instructions }
 */
export async function updateAddress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const fields = readFields(req.body, true);
    if (typeof fields === 'string') {
      res.status(400).json({ message: fields });
      return;
    }
    const user = await loadCustomer(req, res);
    if (!user) return;
    const addr = findAddress(user, req.params.id as string);
    if (!addr) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    for (const [key, value] of Object.entries(fields) as [Field, string][]) {
      (addr as any)[key] = key === 'instructions' && value === '' ? undefined : value;
    }
    await user.save();
    sendAddresses(res, user);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/customer/addresses/:id/default
 */
export async function setDefaultAddress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await loadCustomer(req, res);
    if (!user) return;
    const target = findAddress(user, req.params.id as string);
    if (!target) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }
    user.savedAddresses.forEach((addr) => (addr.isDefault = addr === target));
    await user.save();
    sendAddresses(res, user);
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * DELETE /api/customer/addresses/:id
 * Deleting the default promotes the newest remaining address.
 */
export async function deleteAddress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await loadCustomer(req, res);
    if (!user) return;
    const target = findAddress(user, req.params.id as string);
    if (!target) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    user.savedAddresses = user.savedAddresses.filter((addr) => addr !== target) as any;
    if (target.isDefault && user.savedAddresses.length > 0) {
      newestFirst(user.savedAddresses)[0].isDefault = true;
    }
    await user.save();
    sendAddresses(res, user);
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
