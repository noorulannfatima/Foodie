import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import User from '../src/models/user';
import Restaurant from '../src/models/restaurant';
import { notifyCustomer } from '../src/services/push.service';
import { buildOrderStatusMessage } from '../src/services/orderStatusPush';
import * as orderStatusPush from '../src/services/orderStatusPush';
import { makeOrder, makeRestaurant } from './helpers/payoutFixtures';

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
  jest.restoreAllMocks();
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

const TOKEN_A = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';

let seq = 0;
async function makeCustomer(overrides: Record<string, unknown> = {}) {
  seq += 1;
  return User.create({ name: 'Ayesha Khan', email: `ayesha${seq}@test.com`, password: 'password123', ...overrides });
}

function as(user: { _id: unknown }, role = 'customer') {
  const auth = `Bearer ${generateToken(String(user._id), role)}`;
  return {
    get: (path: string) => request(app).get(path).set('Authorization', auth),
    patch: (path: string, body: object) => request(app).patch(path).set('Authorization', auth).send(body),
    post: (path: string, body: object) => request(app).post(path).set('Authorization', auth).send(body),
    delete: (path: string, body: object) => request(app).delete(path).set('Authorization', auth).send(body),
  };
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

describe('/api/customer/preferences', () => {
  it('returns defaults', async () => {
    const res = await as(await makeCustomer()).get('/api/customer/preferences');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      notifications: { push: true, orderUpdates: true, promotions: true },
      language: 'en',
    });
  });

  it('updates part of the preferences and keeps the rest', async () => {
    const customer = await makeCustomer();
    const res = await as(customer).patch('/api/customer/preferences', {
      notifications: { promotions: false },
      language: 'ur',
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      notifications: { push: true, orderUpdates: true, promotions: false },
      language: 'ur',
    });
    const saved = await User.findById(customer._id);
    expect(saved!.preferences.notifications.promotions).toBe(false);
    expect(saved!.preferences.language).toBe('ur');
  });

  it('rejects bad values', async () => {
    const customer = await makeCustomer();
    expect((await as(customer).patch('/api/customer/preferences', { language: 'de' })).status).toBe(400);
    expect((await as(customer).patch('/api/customer/preferences', { notifications: { push: 'yes' } })).status).toBe(400);
    expect((await as(customer).patch('/api/customer/preferences', { notifications: { sms: true } })).status).toBe(400);
    expect((await as(customer).patch('/api/customer/preferences', {})).status).toBe(400);
  });

  it('is customer-only', async () => {
    const restaurant = await makeRestaurant();
    expect((await as(restaurant, 'restaurant').get('/api/customer/preferences')).status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Push tokens
// ---------------------------------------------------------------------------

describe('/api/customer/push-token', () => {
  it('registers and removes a device', async () => {
    const customer = await makeCustomer();
    expect((await as(customer).post('/api/customer/push-token', { token: TOKEN_A })).status).toBe(200);
    expect((await User.findById(customer._id).select('+pushTokens'))!.pushTokens).toEqual([TOKEN_A]);

    expect((await as(customer).delete('/api/customer/push-token', { token: TOKEN_A })).status).toBe(200);
    expect((await User.findById(customer._id).select('+pushTokens'))!.pushTokens).toEqual([]);
  });

  it('moves a device from a restaurant account to the customer who signs in on it', async () => {
    const restaurant = await makeRestaurant({ pushTokens: [TOKEN_A] });
    const customer = await makeCustomer();
    await as(customer).post('/api/customer/push-token', { token: TOKEN_A });
    expect((await Restaurant.findById(restaurant._id).select('+pushTokens'))!.pushTokens).toEqual([]);
  });

  it('rejects invalid tokens', async () => {
    const res = await as(await makeCustomer()).post('/api/customer/push-token', { token: 'nope' });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

describe('notifyCustomer', () => {
  function mockExpo() {
    return jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: 'ok' }] }),
    } as Response);
  }

  const build = (language: string) => ({ title: `title-${language}`, body: 'body' });

  it('sends in the customer\'s language', async () => {
    const fetchMock = mockExpo();
    const customer = await makeCustomer({ pushTokens: [TOKEN_A], preferences: { language: 'ur' } });
    await notifyCustomer(customer._id, 'orderUpdates', build);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [message] = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(message).toMatchObject({ to: TOKEN_A, title: 'title-ur', data: { category: 'orderUpdates' } });
  });

  it('respects the push and category switches', async () => {
    const fetchMock = mockExpo();
    const noUpdates = await makeCustomer({
      pushTokens: [TOKEN_A],
      preferences: { notifications: { orderUpdates: false } },
    });
    await notifyCustomer(noUpdates._id, 'orderUpdates', build);
    const noPush = await makeCustomer({ pushTokens: [TOKEN_A], preferences: { notifications: { push: false } } });
    await notifyCustomer(noPush._id, 'orderUpdates', build);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('localises order status messages', () => {
    expect(buildOrderStatusMessage('en', 'Preparing', 'Beef House', 'o1')).toEqual({
      title: 'Being prepared',
      body: 'Beef House is preparing your food.',
      data: { type: 'order_status', orderId: 'o1', status: 'Preparing' },
    });
    expect(buildOrderStatusMessage('ur', 'Delivered', 'Beef House', 'o1').title).toBe('ڈیلیور ہو گیا');
  });
});

describe('order status changes', () => {
  it('notifies the customer when the restaurant updates the order', async () => {
    const spy = jest.spyOn(orderStatusPush, 'notifyOrderStatus').mockResolvedValue();
    const restaurant = await makeRestaurant();
    const order = await makeOrder(restaurant, { subtotal: 1000, status: 'Pending' });

    const update = await request(app)
      .put(`/restaurant/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${generateToken(String(restaurant._id), 'restaurant')}`)
      .send({ status: 'Confirmed' });
    expect(update.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ _id: order._id }), 'Confirmed');
  });
});
