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

async function createRider(overrides: Record<string, unknown> = {}) {
  seq += 1;
  const rider = await DeliveryPerson.create({
    name: 'Bilal Ahmed',
    email: `rider${seq}@test.com`,
    password: 'password123',
    phone: `0300 00000${String(seq).padStart(2, '0')}`,
    vehicle: { type: 'Bike', plateNumber: `KHI-${seq}` },
    licenseNumber: `LIC${seq}`,
    isOnline: true,
    ...overrides,
  });
  return { rider, token: generateToken(String(rider._id), 'delivery') };
}

async function createOrder(status: string, extra: Record<string, unknown> = {}) {
  seq += 1;
  const customer = await User.create({
    name: 'Noor',
    email: `customer${seq}@test.com`,
    password: 'password123',
    phone: '0300 7654321',
  });
  const restaurant = await Restaurant.create({
    name: 'Beef House',
    email: `restaurant${seq}@test.com`,
    password: 'password123',
    description: 'Charcoal grill and BBQ',
    phone: '0300 1234567',
    address: { street: '1 Main St', city: 'Karachi', zipCode: '74000' },
    cuisineTypes: ['BBQ'],
  });
  return Order.create({
    customer: customer._id,
    restaurant: restaurant._id,
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: 'Steak', quantity: 1, price: 100 }],
    deliveryAddress: { street: '2 Side St', city: 'Karachi', zipCode: '74000' },
    pricing: { subtotal: 100, deliveryFee: 100, tax: 0, tip: 0, total: 200 },
    payment: { method: 'Cash' },
    status,
    estimatedPreparationTime: 20,
    estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
    ...extra,
  });
}

function accept(token: string, orderId: unknown) {
  return request(app)
    .post(`/api/delivery/orders/${String(orderId)}/accept`)
    .set('Authorization', `Bearer ${token}`);
}

function setStatus(token: string, orderId: unknown, status: string, extra: Record<string, unknown> = {}) {
  return request(app)
    .patch(`/api/delivery/orders/${String(orderId)}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status, ...extra });
}

function getActive(token: string) {
  return request(app).get('/api/delivery/orders/active').set('Authorization', `Bearer ${token}`);
}

function acknowledge(token: string, orderId: unknown) {
  return request(app)
    .post(`/api/delivery/orders/${String(orderId)}/acknowledge-cancellation`)
    .set('Authorization', `Bearer ${token}`);
}

function customerCancel(order: { _id: unknown; customer: unknown }) {
  return request(app)
    .post(`/api/customer/orders/${String(order._id)}/cancel`)
    .set('Authorization', `Bearer ${generateToken(String(order.customer), 'customer')}`)
    .send({ reason: 'Changed my mind' });
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

describe('GET /api/delivery/orders/requests', () => {
  it('keeps unassigned orders visible while the restaurant is preparing them', async () => {
    const { token } = await createRider();
    const confirmed = await createOrder('Confirmed');
    const preparing = await createOrder('Preparing');
    const ready = await createOrder('Ready');
    await createOrder('Pending');

    const res = await request(app)
      .get('/api/delivery/orders/requests')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.orders.map((o: { id: string }) => o.id).sort();
    expect(ids).toEqual([confirmed, preparing, ready].map((o) => String(o._id)).sort());
  });
});

// ---------------------------------------------------------------------------
// Accept
// ---------------------------------------------------------------------------

describe('POST /api/delivery/orders/:id/accept', () => {
  it('assigns the order to the rider and records it on the timeline', async () => {
    const { rider, token } = await createRider();
    const order = await createOrder('Preparing');

    const res = await accept(token, order._id);

    expect(res.status).toBe(200);
    const saved = await Order.findById(order._id);
    expect(String(saved!.deliveryPerson)).toBe(String(rider._id));
    expect(saved!.timeline.map((t) => t.status)).toContain('Assigned');
  });

  it('lets only one of two riders accepting at the same moment win', async () => {
    const a = await createRider();
    const b = await createRider();
    const order = await createOrder('Ready');

    const results = await Promise.all([accept(a.token, order._id), accept(b.token, order._id)]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const saved = await Order.findById(order._id);
    const winner = results[0].status === 200 ? a.rider : b.rider;
    expect(String(saved!.deliveryPerson)).toBe(String(winner._id));
    expect(saved!.timeline.filter((t) => t.status === 'Assigned')).toHaveLength(1);
  });

  it('refuses a rider who is offline', async () => {
    const { token } = await createRider({ isOnline: false });
    const order = await createOrder('Ready');

    const res = await accept(token, order._id);

    expect(res.status).toBe(403);
    expect((await Order.findById(order._id))!.deliveryPerson).toBeUndefined();
  });

  it('refuses a rider whose account is deactivated', async () => {
    const { token } = await createRider({ isActive: false });
    const order = await createOrder('Ready');

    const res = await accept(token, order._id);

    expect(res.status).toBe(403);
    expect((await Order.findById(order._id))!.deliveryPerson).toBeUndefined();
  });

  it('refuses a rider who is already on a delivery', async () => {
    const { rider, token } = await createRider();
    await createOrder('PickedUp', { deliveryPerson: rider._id });
    const order = await createOrder('Ready');

    const res = await accept(token, order._id);

    expect(res.status).toBe(409);
    expect((await Order.findById(order._id))!.deliveryPerson).toBeUndefined();
  });

  it('never leaves one rider holding two orders when they accept both at once', async () => {
    const { rider, token } = await createRider();
    const first = await createOrder('Ready');
    const second = await createOrder('Ready');

    await Promise.all([accept(token, first._id), accept(token, second._id)]);

    expect(await Order.countDocuments({ deliveryPerson: rider._id })).toBeLessThanOrEqual(1);
  });

  it('returns 409 for an order that was already taken', async () => {
    const other = await createRider();
    const { token } = await createRider();
    const order = await createOrder('Ready', { deliveryPerson: other.rider._id });

    const res = await accept(token, order._id);

    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// Status updates
// ---------------------------------------------------------------------------

describe('PATCH /api/delivery/orders/:id/status', () => {
  it.each(['Confirmed', 'Preparing'])('does not allow pickup while the order is %s', async (status) => {
    const { rider, token } = await createRider();
    const order = await createOrder(status, { deliveryPerson: rider._id });

    const res = await setStatus(token, order._id, 'PickedUp');

    expect(res.status).toBe(400);
    expect((await Order.findById(order._id))!.status).toBe(status);
  });

  it('allows pickup once the restaurant marks the order ready', async () => {
    const { rider, token } = await createRider();
    const order = await createOrder('Ready', { deliveryPerson: rider._id });

    const res = await setStatus(token, order._id, 'PickedUp');

    expect(res.status).toBe(200);
    expect((await Order.findById(order._id))!.status).toBe('PickedUp');
  });
});

// ---------------------------------------------------------------------------
// Earnings periods
// ---------------------------------------------------------------------------

describe('GET /api/delivery/me earnings', () => {
  it('counts today/week/month from delivery history, not from ever-growing counters', async () => {
    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const { rider, token } = await createRider();
    const history = [
      { at: new Date(), earnings: 100 },
      { at: daysAgo(40), earnings: 500 }, // outside this month, week and day
    ].map(({ at, earnings }) => ({
      order: new mongoose.Types.ObjectId(),
      restaurant: new mongoose.Types.ObjectId(),
      customer: new mongoose.Types.ObjectId(),
      status: 'delivered',
      earnings,
      distance: 1,
      createdAt: at,
    }));
    // Stale counters from before the fix: they must not leak into the response
    await DeliveryPerson.collection.updateOne(
      { _id: rider._id },
      {
        $set: {
          deliveryHistory: history,
          'earnings.total': 600,
          'earnings.today': 9999,
          'earnings.thisWeek': 9999,
          'earnings.thisMonth': 9999,
        },
      },
    );

    const res = await request(app).get('/api/delivery/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.earnings).toMatchObject({ total: 600, today: 100, thisWeek: 100, thisMonth: 100 });
  });

  it('ignores cancelled deliveries', async () => {
    const { rider, token } = await createRider();
    await DeliveryPerson.collection.updateOne(
      { _id: rider._id },
      {
        $set: {
          deliveryHistory: [
            {
              order: new mongoose.Types.ObjectId(),
              restaurant: new mongoose.Types.ObjectId(),
              customer: new mongoose.Types.ObjectId(),
              status: 'cancelled',
              earnings: 80,
              distance: 1,
              createdAt: new Date(),
            },
          ],
        },
      },
    );

    const res = await request(app).get('/api/delivery/me').set('Authorization', `Bearer ${token}`);

    expect(res.body.profile.earnings).toMatchObject({ today: 0, thisWeek: 0, thisMonth: 0 });
  });
});

// ---------------------------------------------------------------------------
// Active order: customer details and cancellation notice
// ---------------------------------------------------------------------------

describe('GET /api/delivery/orders/active', () => {
  it("gives the assigned rider the customer's contact and the cash to collect", async () => {
    const { rider, token } = await createRider();
    await createOrder('Ready', { deliveryPerson: rider._id, specialInstructions: 'Extra napkins' });

    const res = await getActive(token);

    expect(res.status).toBe(200);
    expect(res.body.order.customer).toEqual({ name: 'Noor', phone: '0300 7654321' });
    expect(res.body.order.specialInstructions).toBe('Extra napkins');
    expect(res.body.order.cashToCollect).toBe(200);
    expect(res.body.cancelledOrder).toBeNull();
  });

  it('never shows customer details in the request list', async () => {
    const { token } = await createRider();
    await createOrder('Ready');

    const res = await request(app)
      .get('/api/delivery/orders/requests')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].customer).toBeUndefined();
  });

  it('tells the rider when the customer cancels an order they accepted', async () => {
    const { token } = await createRider();
    const order = await createOrder('Preparing');
    await accept(token, order._id);

    expect((await customerCancel(order)).status).toBe(200);
    const res = await getActive(token);

    expect(res.body.order).toBeNull();
    expect(res.body.cancelledOrder).toMatchObject({
      id: String(order._id),
      orderNumber: order.orderNumber,
      restaurantName: 'Beef House',
      cancellationReason: 'Changed my mind',
    });
  });

  it('stops showing the cancellation once the rider dismisses it', async () => {
    const { token } = await createRider();
    const order = await createOrder('Preparing');
    await accept(token, order._id);
    await customerCancel(order);

    expect((await acknowledge(token, order._id)).status).toBe(200);
    expect((await acknowledge(token, order._id)).status).toBe(200); // idempotent

    expect((await getActive(token)).body.cancelledOrder).toBeNull();
  });

  it("does not let a rider dismiss another rider's cancellation", async () => {
    const owner = await createRider();
    const other = await createRider();
    const order = await createOrder('Cancelled', { deliveryPerson: owner.rider._id });

    expect((await acknowledge(other.token, order._id)).status).toBe(404);
  });

  it('ignores cancellations older than a day', async () => {
    const { rider, token } = await createRider();
    const order = await createOrder('Cancelled', { deliveryPerson: rider._id });
    await Order.collection.updateOne(
      { _id: order._id },
      { $set: { updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
    );

    expect((await getActive(token)).body.cancelledOrder).toBeNull();
  });
});
