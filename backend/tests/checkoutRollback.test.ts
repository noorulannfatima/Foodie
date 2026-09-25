import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import User from '../src/models/user';
import Restaurant from '../src/models/restaurant';
import Menu from '../src/models/menu';
import Order from '../src/models/order';
import Cart from '../src/models/cart';
import * as push from '../src/services/push.service';
import * as safepay from '../src/services/safepay.service';

// Checkout writes the order and closes the cart in one transaction, which
// needs a replica set — a standalone memory server rejects transactions.
let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  // Collections must exist before a transaction writes to them.
  await Promise.all([Order.createCollection(), Cart.createCollection()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(() => {
  jest.spyOn(push, 'notifyRestaurant').mockResolvedValue();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await Promise.all([
    Order.deleteMany({}),
    Cart.deleteMany({}),
    Menu.deleteMany({}),
    Restaurant.deleteMany({}),
    User.deleteMany({}),
  ]);
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

async function createWorld() {
  seq += 1;
  const customer = await User.create({
    name: 'Ayesha Khan',
    email: `checkout${seq}@test.com`,
    password: 'password123',
  });
  const restaurant = await Restaurant.create({
    name: 'Lahore Grill',
    email: `grill${seq}@test.com`,
    password: 'password123',
    description: 'Grill and karahi',
    phone: '0300 1234567',
    address: { street: '1 Main St', city: 'Lahore', zipCode: '54000' },
    cuisineTypes: ['Pakistani'],
  });
  const menu = await Menu.create({
    restaurant: restaurant._id,
    categories: [{ name: 'Mains' }],
    items: [{ name: 'Family Feast Deal', description: 'Serves 4', price: 2000, category: 'Mains' }],
  });

  return {
    customer,
    restaurant,
    menuItemId: String(menu.items[0]?._id),
    token: generateToken(customer._id.toString(), 'customer'),
  };
}

async function fillCart(world: Awaited<ReturnType<typeof createWorld>>) {
  await request(app)
    .post('/api/customer/cart/add')
    .set('Authorization', `Bearer ${world.token}`)
    .send({ restaurantId: world.restaurant._id.toString(), menuItem: world.menuItemId, quantity: 2 })
    .expect(200);
}

function placeOrder(token: string, paymentMethod = 'Safepay') {
  return request(app)
    .post('/api/customer/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      deliveryAddress: { street: 'Model town', city: 'Lahore', zipCode: '54770' },
      paymentMethod,
    });
}

function rollback(token: string, orderId: string) {
  return request(app)
    .post(`/api/customer/orders/${orderId}/rollback`)
    .set('Authorization', `Bearer ${token}`)
    .send({ reason: 'Payment failed' });
}

async function activeCartItems(customerId: mongoose.Types.ObjectId) {
  const cart = await Cart.findOne({ customer: customerId, status: 'Active' });
  return cart ? cart.items.map((i) => ({ name: i.name, quantity: i.quantity })) : null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createOrder atomicity', () => {
  it('links the order to its cart and closes the cart', async () => {
    const world = await createWorld();
    await fillCart(world);

    const res = await placeOrder(world.token).expect(201);

    const order = await Order.findById(res.body.order._id);
    const cart = await Cart.findById(order!.cart);
    expect(cart!.status).toBe('Completed');
    expect(await activeCartItems(world.customer._id)).toBeNull();
  });

  it('persists no order when closing the cart fails', async () => {
    const world = await createWorld();
    await fillCart(world);
    jest.spyOn(Cart.prototype, 'save').mockRejectedValueOnce(new Error('write conflict'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await placeOrder(world.token).expect(500);

    expect(await Order.countDocuments({ customer: world.customer._id })).toBe(0);
    expect(await activeCartItems(world.customer._id)).toEqual([
      { name: 'Family Feast Deal', quantity: 2 },
    ]);
  });
});

describe('POST /api/customer/orders/:id/rollback', () => {
  it('cancels the unpaid order and restores the cart', async () => {
    const world = await createWorld();
    await fillCart(world);
    const { body } = await placeOrder(world.token).expect(201);

    const res = await rollback(world.token, body.order._id).expect(200);

    expect(res.body.cartRestored).toBe(true);
    const order = await Order.findById(body.order._id);
    expect(order!.status).toBe('Cancelled');
    expect(order!.payment.status).toBe('Failed');
    expect(await activeCartItems(world.customer._id)).toEqual([
      { name: 'Family Feast Deal', quantity: 2 },
    ]);

    // The customer can now check out again with the restored cart.
    await placeOrder(world.token, 'Cash').expect(201);
  });

  it('refuses to roll back an order that is already confirmed', async () => {
    const world = await createWorld();
    await fillCart(world);
    const { body } = await placeOrder(world.token, 'Cash').expect(201);
    await request(app)
      .post('/api/payments/cod/confirm')
      .set('Authorization', `Bearer ${world.token}`)
      .send({ orderId: body.order._id })
      .expect(200);

    await rollback(world.token, body.order._id).expect(409);

    expect((await Order.findById(body.order._id))!.status).toBe('Confirmed');
    expect(await activeCartItems(world.customer._id)).toBeNull();
  });

  it('refuses to roll back a paid order', async () => {
    const world = await createWorld();
    await fillCart(world);
    const { body } = await placeOrder(world.token).expect(201);
    await Order.updateOne({ _id: body.order._id }, { 'payment.status': 'Completed' });

    await rollback(world.token, body.order._id).expect(409);
  });

  it('does not overwrite a newer cart the customer already started', async () => {
    const world = await createWorld();
    await fillCart(world);
    const { body } = await placeOrder(world.token).expect(201);
    await request(app)
      .post('/api/customer/cart/add')
      .set('Authorization', `Bearer ${world.token}`)
      .send({ restaurantId: world.restaurant._id.toString(), menuItem: world.menuItemId, quantity: 1 })
      .expect(200);

    const res = await rollback(world.token, body.order._id).expect(200);

    expect(res.body.cartRestored).toBe(false);
    expect((await Order.findById(body.order._id))!.status).toBe('Cancelled');
    expect(await activeCartItems(world.customer._id)).toEqual([
      { name: 'Family Feast Deal', quantity: 1 },
    ]);
  });

  it("returns 404 for another customer's order", async () => {
    const world = await createWorld();
    const other = await createWorld();
    await fillCart(world);
    const { body } = await placeOrder(world.token).expect(201);

    await rollback(other.token, body.order._id).expect(404);
  });
});

describe('automatic rollback on Safepay failure', () => {
  it('rolls back when the Safepay session cannot be started', async () => {
    const world = await createWorld();
    await fillCart(world);
    const { body } = await placeOrder(world.token).expect(201);
    jest.spyOn(safepay, 'createTracker').mockRejectedValue(new Error('Safepay unreachable'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app)
      .post('/api/payments/safepay/initiate')
      .set('Authorization', `Bearer ${world.token}`)
      .send({ orderId: body.order._id })
      .expect(502);

    expect(res.body.rolledBack).toBe(true);
    expect((await Order.findById(body.order._id))!.status).toBe('Cancelled');
    expect(await activeCartItems(world.customer._id)).toEqual([
      { name: 'Family Feast Deal', quantity: 2 },
    ]);
  });
});
