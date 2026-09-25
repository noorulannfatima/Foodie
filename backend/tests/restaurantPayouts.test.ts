import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import Restaurant from '../src/models/restaurant';
import * as push from '../src/services/push.service';
import { generatePayouts, markPayoutPaid } from '../src/services/payout.service';
import { bankAccount, makeOrder, makeRestaurant } from './helpers/payoutFixtures';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
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
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

function as(restaurant: { _id: unknown }) {
  const token = generateToken(String(restaurant._id), 'restaurant');
  return {
    get: (path: string) => request(app).get(path).set('Authorization', `Bearer ${token}`),
    put: (path: string, body: object) =>
      request(app).put(path).set('Authorization', `Bearer ${token}`).send(body),
  };
}

// ---------------------------------------------------------------------------
// GET /restaurant/payouts/summary
// ---------------------------------------------------------------------------

describe('GET /restaurant/payouts/summary', () => {
  it('returns the unsettled balance, processing total, last payout, and account', async () => {
    const r = await makeRestaurant({ payoutAccount: { ...bankAccount(), status: 'Verified' } });
    await makeOrder(r, { subtotal: 1000 });
    const [first] = await generatePayouts();
    await markPayoutPaid(String(first._id), 'TX1');
    await makeOrder(r, { subtotal: 2000 });
    await generatePayouts();
    await makeOrder(r, { subtotal: 1000, method: 'Cash' });

    const res = await as(r).get('/restaurant/payouts/summary');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      commissionRate: 0.15,
      paymentFeeRate: 0.025,
      unsettled: { orderCount: 1, cashSales: 1000, netAmount: -150 },
      processing: { count: 1, amount: 1650 },
      lastPaid: { netAmount: 825, reference: 'TX1' },
      payoutAccount: { method: 'Bank', status: 'Verified' },
    });
  });

  it('returns zeros and nulls for a new restaurant', async () => {
    const r = await makeRestaurant();
    const res = await as(r).get('/restaurant/payouts/summary');
    expect(res.body).toMatchObject({
      unsettled: { orderCount: 0, netAmount: 0 },
      processing: { count: 0, amount: 0 },
      lastPaid: null,
      payoutAccount: null,
    });
  });

  it('is restaurant-only', async () => {
    const res = await request(app)
      .get('/restaurant/payouts/summary')
      .set('Authorization', `Bearer ${generateToken(String(new mongoose.Types.ObjectId()), 'admin')}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// History & detail
// ---------------------------------------------------------------------------

describe('payout history', () => {
  it('lists only this restaurant\'s payouts, newest first, paginated', async () => {
    const r = await makeRestaurant();
    const other = await makeRestaurant();
    await makeOrder(other, { subtotal: 500 });
    for (const subtotal of [1000, 2000, 3000]) {
      await makeOrder(r, { subtotal });
      await generatePayouts();
    }

    const page1 = await as(r).get('/restaurant/payouts?limit=2');
    expect(page1.status).toBe(200);
    expect(page1.body.payouts.map((p: any) => p.grossSales)).toEqual([3000, 2000]);
    expect(page1.body.hasMore).toBe(true);
    expect(page1.body.payouts[0].orders).toBeUndefined();

    const page2 = await as(r).get('/restaurant/payouts?limit=2&page=2');
    expect(page2.body.payouts.map((p: any) => p.grossSales)).toEqual([1000]);
    expect(page2.body.hasMore).toBe(false);
  });

  it('shows a payout with its orders, but not another restaurant\'s', async () => {
    const r = await makeRestaurant();
    const other = await makeRestaurant();
    const order = await makeOrder(r, { subtotal: 1000, method: 'Cash' });
    await makeOrder(other, { subtotal: 500 });
    const created = await generatePayouts();
    const mine = created.find((p) => String(p.restaurant) === String(r._id))!;
    const theirs = created.find((p) => String(p.restaurant) === String(other._id))!;

    const res = await as(r).get(`/restaurant/payouts/${mine._id}`);
    expect(res.status).toBe(200);
    expect(res.body.payout.netAmount).toBe(-150);
    expect(res.body.orders).toEqual([
      expect.objectContaining({ orderNumber: order.orderNumber, subtotal: 1000, method: 'Cash' }),
    ]);

    expect((await as(r).get(`/restaurant/payouts/${theirs._id}`)).status).toBe(404);
    expect((await as(r).get('/restaurant/payouts/nope')).status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// PUT /restaurant/payouts/account
// ---------------------------------------------------------------------------

describe('PUT /restaurant/payouts/account', () => {
  const put = (r: { _id: unknown }, body: object) => as(r).put('/restaurant/payouts/account', body);

  it('saves a bank account as Pending after checking the password', async () => {
    const r = await makeRestaurant();
    const res = await put(r, {
      method: 'Bank',
      accountTitle: 'Karachi Kitchen',
      bankName: 'Meezan Bank',
      iban: 'pk36 mezn 0001 2301 0456 7890',
      currentPassword: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.payoutAccount).toMatchObject({
      method: 'Bank',
      iban: 'PK36MEZN0001230104567890',
      status: 'Pending',
    });
    expect((await Restaurant.findById(r._id))!.payoutAccount!.iban).toBe('PK36MEZN0001230104567890');
  });

  it('saves a wallet account and drops bank fields', async () => {
    const r = await makeRestaurant({ payoutAccount: { ...bankAccount(), status: 'Verified' } });
    const res = await put(r, {
      method: 'JazzCash',
      accountTitle: 'Ali Raza',
      mobileNumber: '0300-1234567',
      iban: 'PK36MEZN0001230104567890',
      currentPassword: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.payoutAccount).toMatchObject({ method: 'JazzCash', mobileNumber: '03001234567', status: 'Pending' });
    expect(res.body.payoutAccount.iban).toBeUndefined();
    expect(res.body.payoutAccount.bankName).toBeUndefined();
  });

  it('rejects a wrong or missing password', async () => {
    const r = await makeRestaurant();
    const body = { method: 'JazzCash', accountTitle: 'Ali', mobileNumber: '03001234567' };
    expect((await put(r, body)).status).toBe(400);
    const wrong = await put(r, { ...body, currentPassword: 'nope' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.message).toMatch(/password/i);
    expect((await Restaurant.findById(r._id))!.payoutAccount).toBeUndefined();
  });

  it('validates fields for the chosen method', async () => {
    const r = await makeRestaurant();
    const base = { accountTitle: 'Karachi Kitchen', currentPassword: 'password123' };
    expect((await put(r, { ...base, method: 'Paypal' })).status).toBe(400);
    expect((await put(r, { ...base, method: 'Bank', bankName: 'Meezan', iban: 'PK12' })).status).toBe(400);
    expect((await put(r, { ...base, method: 'Bank', iban: 'PK36MEZN0001230104567890' })).status).toBe(400);
    expect((await put(r, { ...base, method: 'Easypaisa', mobileNumber: '12345' })).status).toBe(400);
    expect((await put(r, { method: 'Easypaisa', mobileNumber: '03001234567', currentPassword: 'password123' })).status).toBe(400);
  });
});

describe('restaurant signup', () => {
  it('cannot set its own commission or a pre-verified payout account', async () => {
    const res = await request(app)
      .post('/auth/restaurant/signup')
      .send({
        name: 'Sneaky Grill',
        email: 'sneaky@test.com',
        password: 'password123',
        description: 'Charcoal grill and kebabs',
        phone: '0300 1234567',
        address: { street: '1 Main St', city: 'Karachi', zipCode: '74000' },
        cuisineTypes: ['BBQ'],
        commissionRate: 0,
        payoutAccount: { ...bankAccount(), status: 'Verified' },
      });
    expect(res.status).toBe(201);
    const saved = await Restaurant.findOne({ email: 'sneaky@test.com' });
    expect(saved!.commissionRate).toBe(0.15);
    expect(saved!.payoutAccount).toBeUndefined();
  });
});
