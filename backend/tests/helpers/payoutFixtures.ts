import mongoose from 'mongoose';
import User from '../../src/models/user';
import Restaurant from '../../src/models/restaurant';
import Order from '../../src/models/order';

/** Shared fixtures for the payout tests. Stateless, so they survive collection wipes between tests. */

let seq = 0;
const CUSTOMER_EMAIL = 'payout-customer@test.com';

export async function makeRestaurant(overrides: Record<string, unknown> = {}) {
  seq += 1;
  return Restaurant.create({
    name: `Karachi Kitchen ${seq}`,
    email: `restaurant${seq}@test.com`,
    password: 'password123',
    description: 'Home-style Pakistani food',
    phone: '0300 1234567',
    address: { street: '1 Main St', city: 'Karachi', zipCode: '74000' },
    cuisineTypes: ['Pakistani'],
    ...overrides,
  });
}

export function bankAccount() {
  return {
    method: 'Bank',
    accountTitle: 'Karachi Kitchen Pvt Ltd',
    bankName: 'Meezan Bank',
    iban: 'PK36MEZN0001230104567890',
  };
}

async function getCustomerId() {
  const existing = await User.findOne({ email: CUSTOMER_EMAIL }).select('_id');
  if (existing) return existing._id;
  const customer = await User.create({ name: 'Ayesha Khan', email: CUSTOMER_EMAIL, password: 'password123' });
  return customer._id;
}

export async function makeOrder(
  restaurant: { _id: mongoose.Types.ObjectId | unknown },
  opts: {
    subtotal: number;
    method?: string;
    status?: string;
    paymentStatus?: string;
    deliveredAt?: Date;
  }
) {
  seq += 1;
  const status = opts.status ?? 'Delivered';
  return Order.create({
    orderNumber: `ORD-${seq}`,
    customer: await getCustomerId(),
    restaurant: restaurant._id as mongoose.Types.ObjectId,
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: 'Biryani', quantity: 1, price: opts.subtotal }],
    deliveryAddress: { street: '2 Side St', city: 'Karachi', zipCode: '74000' },
    pricing: { subtotal: opts.subtotal, deliveryFee: 100, tax: 0, tip: 50, total: opts.subtotal + 150 },
    payment: {
      method: opts.method ?? 'Safepay',
      status: opts.paymentStatus ?? (status === 'Delivered' ? 'Completed' : 'Pending'),
    },
    status,
    actualDeliveryTime: status === 'Delivered' ? opts.deliveredAt ?? new Date() : undefined,
    estimatedPreparationTime: 20,
    estimatedDeliveryTime: new Date(),
  });
}
