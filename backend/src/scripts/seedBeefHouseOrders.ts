import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/user';
import DeliveryPerson from '../models/deliveryperson';
import Restaurant from '../models/restaurant';
import Menu from '../models/menu';
import Order from '../models/order';
import Review from '../models/review';
import {
  recalculateDeliveryRating,
  recalculateRestaurantRatings,
} from '../services/rating.service';

/**
 * Seeds a demo customer and rider with three delivered Beef House orders.
 * The most recent order carries one review with four ratings: one per dish
 * (three dishes) plus the rider. Re-running wipes the previous seed first.
 *
 * Usage: npm run seed:beefhouse
 */

const PASSWORD = 'Password123!';
const CUSTOMER_EMAIL = 'ali.customer@example.com';
const RIDER_EMAIL = 'bilal.rider@example.com';
const RIDER_PHONE = '+92 300 1234567';

const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

const deliveryAddress = {
  street: '12-B Main Boulevard, Gulberg III',
  city: 'Lahore',
  zipCode: '54660',
  latitude: 31.5104,
  longitude: 74.3441,
  instructions: 'Ring the bell twice',
};

/** Each order: dish names with quantities, how many days ago it was placed, and the tip. */
const ORDERS = [
  {
    daysAgo: 2,
    tip: 0,
    lines: [
      { name: 'Classic Beef Burger with Fries', quantity: 1 },
      { name: 'Double Cheese Smash Burger', quantity: 1 },
      { name: 'Fresh Lemon Lime Cooler', quantity: 2 },
    ],
  },
  {
    daysAgo: 6,
    tip: 100,
    lines: [
      { name: 'Smoky Pineapple Beef Burger', quantity: 2 },
      { name: 'Fresh Lemon Lime Cooler', quantity: 1 },
    ],
  },
  {
    daysAgo: 11,
    tip: 50,
    lines: [{ name: 'Family Feast Deal', quantity: 1 }],
  },
];

/** Mirrors estDriverPayout in delivery.controller. */
function driverPayout(deliveryFee: number, tip: number): number {
  return Math.round((deliveryFee * 0.6 + tip * 0.85) * 100) / 100;
}

async function removePreviousSeed() {
  const customer = await User.findOne({ email: CUSTOMER_EMAIL }).select('_id');
  const rider = await DeliveryPerson.findOne({ email: RIDER_EMAIL }).select('_id');
  const owners = [customer?._id, rider?._id].filter(Boolean);
  if (owners.length === 0) return;

  const orderFilter = {
    $or: [
      ...(customer ? [{ customer: customer._id }] : []),
      ...(rider ? [{ deliveryPerson: rider._id }] : []),
    ],
  };
  await Review.deleteMany(orderFilter);
  await Order.deleteMany(orderFilter);
  if (customer) await User.deleteOne({ _id: customer._id });
  if (rider) await DeliveryPerson.deleteOne({ _id: rider._id });
  console.log('Removed previous seed data');
}

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI);

  const restaurant = await Restaurant.findOne({ name: 'Beef House' });
  if (!restaurant) throw new Error('Restaurant "Beef House" not found');
  const menu = await Menu.findOne({ restaurant: restaurant._id });
  if (!menu) throw new Error('Beef House has no menu');

  const dishByName = new Map(menu.items.map((item) => [item.name, item]));
  for (const { lines } of ORDERS) {
    for (const { name } of lines) {
      if (!dishByName.has(name)) throw new Error(`Menu item "${name}" not found on Beef House`);
    }
  }

  await removePreviousSeed();

  const customer = await User.create({
    name: 'Ali Raza',
    email: CUSTOMER_EMAIL,
    password: PASSWORD,
    phone: '+92 321 7654321',
    isEmailVerified: true,
    savedAddresses: [
      {
        streetAddress: deliveryAddress.street,
        city: deliveryAddress.city,
        zipCode: deliveryAddress.zipCode,
        country: 'Pakistan',
        latitude: deliveryAddress.latitude,
        longitude: deliveryAddress.longitude,
        instructions: deliveryAddress.instructions,
        isDefault: true,
      },
    ],
  });

  const rider = await DeliveryPerson.create({
    name: 'Bilal Ahmed',
    email: RIDER_EMAIL,
    password: PASSWORD,
    phone: RIDER_PHONE,
    vehicle: { type: 'Bike', model: 'Honda CD 70', plateNumber: 'LEA-1234', color: 'Red' },
    licenseNumber: 'LHR-DL-778899',
    licenseExpiry: new Date(Date.now() + 2 * 365 * DAY),
    currentLocation: { type: 'Point', coordinates: [74.3436, 31.5204], lastUpdated: new Date() },
    isVerified: true,
    isAvailable: true,
    isOnline: false,
  });

  const now = Date.now();
  const deliveryFee = restaurant.deliveryFee || 0;
  const prepTime = restaurant.estimatedDeliveryTime || 30;
  const orders = [];

  for (const spec of ORDERS) {
    const placedAt = new Date(now - spec.daysAgo * DAY);
    const at = (minutes: number) => new Date(placedAt.getTime() + minutes * MINUTE);
    const deliveredAt = at(42);

    const items = spec.lines.map(({ name, quantity }) => {
      const dish = dishByName.get(name)!;
      return {
        menuItem: dish._id!,
        name: dish.name,
        quantity,
        price: dish.discountedPrice ?? dish.price,
        customizations: [],
      };
    });
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;

    const order = new Order({
      customer: customer._id,
      restaurant: restaurant._id,
      deliveryPerson: rider._id,
      items,
      deliveryAddress,
      pricing: {
        subtotal,
        deliveryFee,
        tax,
        discount: 0,
        tip: spec.tip,
        total: subtotal + deliveryFee + tax + spec.tip,
      },
      payment: { method: 'Cash', status: 'Completed', paidAt: deliveredAt },
      status: 'Delivered',
      timeline: [
        { status: 'Pending', timestamp: placedAt, note: 'Order placed' },
        { status: 'Confirmed', timestamp: at(2), note: 'Order confirmed' },
        { status: 'Preparing', timestamp: at(4), note: 'Order preparing' },
        { status: 'Ready', timestamp: at(22), note: 'Order ready' },
        { status: 'Assigned', timestamp: at(23), note: 'Delivery person assigned' },
        { status: 'PickedUp', timestamp: at(27), note: 'Picked up from restaurant' },
        { status: 'OutForDelivery', timestamp: at(28), note: 'Courier en route to customer' },
        { status: 'Delivered', timestamp: deliveredAt, note: 'Delivered by courier' },
      ],
      estimatedPreparationTime: prepTime,
      estimatedDeliveryTime: at(prepTime + 15),
      actualDeliveryTime: deliveredAt,
      createdAt: placedAt,
      updatedAt: deliveredAt,
    });
    await order.save({ timestamps: false });
    orders.push({ order, spec, placedAt, deliveredAt });
  }

  // Rider history and earnings, as patchOrderStatus would have recorded them
  let earningsTotal = 0;
  let earningsThisWeek = 0;
  for (const { order, spec, placedAt, deliveredAt } of orders) {
    const payout = driverPayout(deliveryFee, spec.tip);
    earningsTotal += payout;
    if (spec.daysAgo < 7) earningsThisWeek += payout;
    rider.deliveryHistory.push({
      order: order._id as mongoose.Types.ObjectId,
      restaurant: restaurant._id as mongoose.Types.ObjectId,
      customer: customer._id as mongoose.Types.ObjectId,
      pickupTime: new Date(placedAt.getTime() + 27 * MINUTE),
      deliveryTime: deliveredAt,
      status: 'delivered',
      earnings: payout,
      distance: 3.2,
      duration: 42,
      createdAt: deliveredAt,
    });
  }
  rider.earnings.total = earningsTotal;
  rider.earnings.thisWeek = earningsThisWeek;
  rider.earnings.thisMonth = earningsTotal;
  rider.earnings.pending = earningsTotal;
  await rider.save();

  // One review on the latest order: 3 dish ratings + 1 delivery rating
  const { order: reviewed, deliveredAt } = orders[0];
  const reviewedAt = new Date(deliveredAt.getTime() + 30 * MINUTE);
  const review = new Review({
    order: reviewed._id,
    customer: customer._id,
    customerFirstName: 'Ali',
    restaurant: restaurant._id,
    deliveryPerson: rider._id,
    items: [
      {
        menuItem: reviewed.items[0].menuItem,
        name: reviewed.items[0].name,
        rating: 4,
        comment: 'Juicy patty and crispy fries, would order again.',
      },
      { menuItem: reviewed.items[1].menuItem, name: reviewed.items[1].name, rating: 5 },
      { menuItem: reviewed.items[2].menuItem, name: reviewed.items[2].name, rating: 3 },
    ],
    delivery: { rating: 4, comment: 'Arrived hot and on time.' },
    createdAt: reviewedAt,
    updatedAt: reviewedAt,
  });
  await review.save({ timestamps: false });

  await recalculateRestaurantRatings(restaurant._id as mongoose.Types.ObjectId);
  await recalculateDeliveryRating(rider._id as mongoose.Types.ObjectId);

  console.log(`Customer: ${CUSTOMER_EMAIL} / ${PASSWORD}`);
  console.log(`Rider:    ${RIDER_EMAIL} / ${PASSWORD}`);
  for (const { order } of orders) {
    console.log(`Order ${order.orderNumber}: Rs. ${order.pricing.total} (Delivered)`);
  }
  console.log(`Review on ${reviewed.orderNumber} with 4 ratings (3 dishes + delivery)`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
