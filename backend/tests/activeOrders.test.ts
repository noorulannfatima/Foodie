import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import User from '../src/models/user';
import Restaurant from '../src/models/restaurant';
import DeliveryPerson from '../src/models/deliveryperson';
import Order from '../src/models/order';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

async function createCustomer() {
  seq += 1;
  return User.create({ name: 'Noor', email: `customer${seq}@test.com`, password: 'password123' });
}

async function createRestaurant() {
  seq += 1;
  return Restaurant.create({
    name: 'Beef House',
    email: `restaurant${seq}@test.com`,
    password: 'password123',
    description: 'Charcoal grill and BBQ',
    phone: '0300 1234567',
    address: { street: '1 Main St', city: 'Karachi', zipCode: '74000' },
    cuisineTypes: ['BBQ'],
  });
}

async function createOrder(
  customerId: mongoose.Types.ObjectId,
  restaurantId: mongoose.Types.ObjectId,
  status: string,
  extra: Record<string, unknown> = {},
) {
  return Order.create({
    customer: customerId,
    restaurant: restaurantId,
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: 'Steak', quantity: 1, price: 100 }],
    deliveryAddress: { street: '2 Side St', city: 'Karachi', zipCode: '74000' },
    pricing: { subtotal: 100, deliveryFee: 0, tax: 0, total: 100 },
    payment: { method: 'Cash' },
    status,
    estimatedPreparationTime: 20,
    estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
    ...extra,
  });
}

/** Push an order's updatedAt into the past without Mongoose resetting it. */
async function ageOrder(orderId: unknown, minutes: number) {
  await Order.collection.updateOne(
    { _id: orderId as mongoose.Types.ObjectId },
    { $set: { updatedAt: new Date(Date.now() - minutes * 60 * 1000) } },
  );
}

function getActive(token: string) {
  return request(app).get('/api/customer/orders/active').set('Authorization', `Bearer ${token}`);
}

// ---------------------------------------------------------------------------
// GET /api/customer/orders/active
// ---------------------------------------------------------------------------

describe('GET /api/customer/orders/active', () => {
  it('returns in-progress orders newest first with restaurant and rider info', async () => {
    const customer = await createCustomer();
    const restaurant = await createRestaurant();
    const rider = await DeliveryPerson.create({
      name: 'Bilal',
      email: 'rider@test.com',
      password: 'password123',
      phone: '0311 0000001',
      vehicle: { type: 'Bike', plateNumber: 'KHI-123' },
      licenseNumber: 'LIC123',
    });

    const older = await createOrder(customer._id, restaurant._id, 'Preparing');
    const newer = await createOrder(customer._id, restaurant._id, 'OutForDelivery', {
      deliveryPerson: rider._id,
    });

    const res = await getActive(generateToken(String(customer._id), 'customer'));

    expect(res.status).toBe(200);
    expect(res.body.orders.map((o: { _id: string }) => o._id)).toEqual([
      String(newer._id),
      String(older._id),
    ]);
    const [first] = res.body.orders;
    expect(first.status).toBe('OutForDelivery');
    expect(first.restaurant.name).toBe('Beef House');
    expect(first.deliveryPerson.name).toBe('Bilal');
    expect(first.deliveryPerson.phone).toBeUndefined();
    expect(first.isReviewed).toBe(false);
    expect(first.items).toBeUndefined();
  });

  it('includes orders delivered or cancelled in the last 30 minutes', async () => {
    const customer = await createCustomer();
    const restaurant = await createRestaurant();
    await createOrder(customer._id, restaurant._id, 'Delivered');
    await createOrder(customer._id, restaurant._id, 'Cancelled', {
      cancellationReason: 'Restaurant closed',
    });

    const res = await getActive(generateToken(String(customer._id), 'customer'));

    expect(res.status).toBe(200);
    const statuses = res.body.orders.map((o: { status: string }) => o.status).sort();
    expect(statuses).toEqual(['Cancelled', 'Delivered']);
    const cancelled = res.body.orders.find((o: { status: string }) => o.status === 'Cancelled');
    expect(cancelled.cancellationReason).toBe('Restaurant closed');
  });

  it('excludes finished orders older than 30 minutes but keeps old in-progress ones', async () => {
    const customer = await createCustomer();
    const restaurant = await createRestaurant();
    const staleDelivered = await createOrder(customer._id, restaurant._id, 'Delivered');
    const slowPreparing = await createOrder(customer._id, restaurant._id, 'Preparing');
    await ageOrder(staleDelivered._id, 31);
    await ageOrder(slowPreparing._id, 90);

    const res = await getActive(generateToken(String(customer._id), 'customer'));

    expect(res.status).toBe(200);
    expect(res.body.orders.map((o: { _id: string }) => o._id)).toEqual([String(slowPreparing._id)]);
  });

  it("does not return other customers' orders", async () => {
    const me = await createCustomer();
    const someoneElse = await createCustomer();
    const restaurant = await createRestaurant();
    await createOrder(someoneElse._id, restaurant._id, 'Preparing');

    const res = await getActive(generateToken(String(me._id), 'customer'));

    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });

  it('rejects non-customer roles', async () => {
    const restaurant = await createRestaurant();
    const res = await getActive(generateToken(String(restaurant._id), 'restaurant'));
    expect(res.status).toBe(403);
  });
});
