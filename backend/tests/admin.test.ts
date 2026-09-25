import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import Order from '../src/models/order';
import Admin from '../src/models/admin';
import Payout from '../src/models/payout';
import * as push from '../src/services/push.service';
import { bankAccount, makeOrder, makeRestaurant } from './helpers/payoutFixtures';
import { generatePayouts } from '../src/services/payout.service';

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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let adminToken: string | null = null;

async function adminReq(method: 'get' | 'post' | 'patch', path: string, body?: object) {
  if (!adminToken) {
    const admin = await Admin.create({ name: 'Ops', email: 'ops-fixture@foodie.pk', password: 'secret123' });
    adminToken = generateToken(String(admin._id), 'admin');
  }
  const req = request(app)[method](path).set('Authorization', `Bearer ${adminToken}`);
  return body ? req.send(body) : req;
}

afterEach(() => {
  // Collections are wiped between tests, so the cached admin would dangle
  adminToken = null;
});

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------

describe('admin auth', () => {
  it('logs in an admin and verifies the token', async () => {
    await Admin.create({ name: 'Ops', email: 'ops@foodie.pk', password: 'secret123' });
    const res = await request(app)
      .post('/auth/admin/login')
      .send({ email: 'ops@foodie.pk', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');

    const verify = await request(app).get('/auth/verify').set('Authorization', `Bearer ${res.body.token}`);
    expect(verify.status).toBe(200);
    expect(verify.body.user.email).toBe('ops@foodie.pk');
  });

  it('blocks admin signup and password reset', async () => {
    const signup = await request(app)
      .post('/auth/admin/signup')
      .send({ name: 'Mallory', email: 'm@foodie.pk', password: 'secret123' });
    expect(signup.status).toBe(403);
    expect(await Admin.countDocuments()).toBe(0);

    const forgot = await request(app).post('/auth/admin/forgot-password').send({ email: 'm@foodie.pk' });
    expect(forgot.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Payout generation
// ---------------------------------------------------------------------------

describe('generatePayouts', () => {
  it('includes only eligible orders and never double-counts', async () => {
    const r = await makeRestaurant();
    const online = await makeOrder(r, { subtotal: 1000, method: 'Safepay' });
    const cash = await makeOrder(r, { subtotal: 500, method: 'Cash' });
    await makeOrder(r, { subtotal: 900, status: 'Preparing' });
    await makeOrder(r, { subtotal: 900, paymentStatus: 'Refunded' });

    const first = await generatePayouts();
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      orderCount: 2,
      grossSales: 1500,
      onlineSales: 1000,
      cashSales: 500,
      commission: 225,
      paymentFees: 25,
      netAmount: 750,
      commissionRate: 0.15,
      status: 'Processing',
    });
    expect(first[0].orders.map(String).sort()).toEqual([String(online._id), String(cash._id)].sort());
    expect((await Order.findById(online._id))!.payout?.toString()).toBe(String(first[0]._id));

    expect(await generatePayouts()).toHaveLength(0);
    expect(await Payout.countDocuments()).toBe(1);
  });

  it('gives a cash-only restaurant a negative net', async () => {
    const r = await makeRestaurant();
    await makeOrder(r, { subtotal: 1000, method: 'Cash' });
    const [p] = await generatePayouts();
    expect(p.netAmount).toBe(-150);
  });

  it('uses each restaurant\'s commission rate', async () => {
    const a = await makeRestaurant({ commissionRate: 0.1 });
    const b = await makeRestaurant();
    await makeOrder(a, { subtotal: 1000 });
    await makeOrder(b, { subtotal: 1000 });
    const created = await generatePayouts();
    const byRestaurant = Object.fromEntries(created.map((p: any) => [String(p.restaurant), p]));
    expect(byRestaurant[String(a._id)].commission).toBe(100);
    expect(byRestaurant[String(b._id)].commission).toBe(150);
  });

  it('only includes orders delivered up to periodEnd', async () => {
    const r = await makeRestaurant();
    await makeOrder(r, { subtotal: 1000, deliveredAt: new Date('2026-09-01') });
    await makeOrder(r, { subtotal: 1000, deliveredAt: new Date('2026-09-20') });
    const [p] = await generatePayouts(new Date('2026-09-10'));
    expect(p.orderCount).toBe(1);
    expect(p.periodStart.toISOString()).toBe(new Date('2026-09-01').toISOString());
    expect(p.periodEnd.toISOString()).toBe(new Date('2026-09-10').toISOString());
  });
});

// ---------------------------------------------------------------------------
// /api/admin endpoints
// ---------------------------------------------------------------------------

describe('/api/admin', () => {
  it('rejects missing and non-admin tokens', async () => {
    expect((await request(app).get('/api/admin/overview')).status).toBe(401);

    const r = await makeRestaurant();
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${generateToken(String(r._id), 'restaurant')}`);
    expect(res.status).toBe(403);
  });

  it('reports an overview of unsettled and processing money', async () => {
    const a = await makeRestaurant({ payoutAccount: bankAccount() });
    await makeOrder(a, { subtotal: 1000 });
    await adminReq('post', '/api/admin/payouts/generate', {});
    await makeOrder(a, { subtotal: 2000 });

    const res = await adminReq('get', '/api/admin/overview');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      unsettledNet: 1650,
      unsettledOrders: 1,
      processingCount: 1,
      processingAmount: 825,
      paidThisMonth: 0,
      pendingAccounts: 1,
    });
  });

  it('lists restaurants with their unsettled balance', async () => {
    const r = await makeRestaurant({ payoutAccount: bankAccount() });
    await makeRestaurant();
    await makeOrder(r, { subtotal: 1000, method: 'Cash' });

    const res = await adminReq('get', '/api/admin/restaurants');
    expect(res.status).toBe(200);
    expect(res.body.restaurants).toHaveLength(2);
    const row = res.body.restaurants.find((x: any) => x._id === String(r._id));
    expect(row.unsettled).toMatchObject({ orderCount: 1, netAmount: -150 });
    expect(row.payoutAccount.status).toBe('Pending');
    const empty = res.body.restaurants.find((x: any) => x._id !== String(r._id));
    expect(empty.unsettled).toMatchObject({ orderCount: 0, netAmount: 0 });
  });

  it('validates and updates the commission rate', async () => {
    const r = await makeRestaurant();
    const path = `/api/admin/restaurants/${r._id}/commission`;
    expect((await adminReq('patch', path, { rate: 0.6 })).status).toBe(400);
    expect((await adminReq('patch', path, { rate: 'abc' })).status).toBe(400);
    const ok = await adminReq('patch', path, { rate: 0.1 });
    expect(ok.status).toBe(200);
    expect(ok.body.restaurant.commissionRate).toBe(0.1);
    expect((await adminReq('patch', `/api/admin/restaurants/${new mongoose.Types.ObjectId()}/commission`, { rate: 0.1 })).status).toBe(404);
  });

  it('verifies and rejects payout accounts', async () => {
    const none = await makeRestaurant();
    expect((await adminReq('patch', `/api/admin/restaurants/${none._id}/payout-account`, { status: 'Verified' })).status).toBe(400);

    const r = await makeRestaurant({ payoutAccount: bankAccount() });
    const path = `/api/admin/restaurants/${r._id}/payout-account`;
    expect((await adminReq('patch', path, { status: 'Rejected' })).status).toBe(400);
    expect((await adminReq('patch', path, { status: 'Bogus' })).status).toBe(400);

    const rejected = await adminReq('patch', path, { status: 'Rejected', reason: 'IBAN title mismatch' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.payoutAccount).toMatchObject({ status: 'Rejected', rejectionReason: 'IBAN title mismatch' });

    const verified = await adminReq('patch', path, { status: 'Verified' });
    expect(verified.body.payoutAccount.status).toBe('Verified');
    expect(verified.body.payoutAccount.rejectionReason).toBeUndefined();
  });

  it('generates, lists, shows, and settles a payout', async () => {
    const r = await makeRestaurant({ payoutAccount: bankAccount() });
    const order = await makeOrder(r, { subtotal: 1000 });

    const gen = await adminReq('post', '/api/admin/payouts/generate', {});
    expect(gen.status).toBe(201);
    expect(gen.body.created).toHaveLength(1);
    const id = gen.body.created[0]._id;

    const list = await adminReq('get', '/api/admin/payouts?status=Processing');
    expect(list.body.payouts).toHaveLength(1);
    expect(list.body.payouts[0].restaurant.name).toBe(r.name);
    expect((await adminReq('get', '/api/admin/payouts?status=Paid')).body.payouts).toHaveLength(0);

    const detail = await adminReq('get', `/api/admin/payouts/${id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.orders).toEqual([
      expect.objectContaining({ _id: String(order._id), orderNumber: order.orderNumber, subtotal: 1000, method: 'Safepay' }),
    ]);

    const paidPath = `/api/admin/payouts/${id}/paid`;
    expect((await adminReq('patch', paidPath, {})).status).toBe(400); // reference required
    expect((await adminReq('patch', paidPath, { reference: 'TX1' })).status).toBe(409); // account unverified

    const failed = await adminReq('patch', `/api/admin/payouts/${id}/failed`, { reason: 'Bank rejected transfer' });
    expect(failed.body.payout).toMatchObject({ status: 'Failed', failureReason: 'Bank rejected transfer' });

    await adminReq('patch', `/api/admin/restaurants/${r._id}/payout-account`, { status: 'Verified' });
    const paid = await adminReq('patch', paidPath, { reference: 'TX1' });
    expect(paid.status).toBe(200);
    expect(paid.body.payout).toMatchObject({ status: 'Paid', reference: 'TX1' });
    expect(paid.body.payout.accountSnapshot.iban).toBe(bankAccount().iban);
    expect(paid.body.payout.failureReason).toBeUndefined();
    expect(push.notifyRestaurant).toHaveBeenCalledWith(
      expect.anything(),
      'payouts',
      expect.objectContaining({ title: 'Payout sent' })
    );

    expect((await adminReq('patch', paidPath, { reference: 'TX2' })).status).toBe(409);
    expect((await adminReq('patch', `/api/admin/payouts/${id}/failed`, { reason: 'x' })).status).toBe(409);

    const overview = await adminReq('get', '/api/admin/overview');
    expect(overview.body.paidThisMonth).toBe(825);
  });

  it('returns 400 for bad ids and 404 for missing payouts', async () => {
    expect((await adminReq('get', '/api/admin/payouts/nope')).status).toBe(400);
    expect((await adminReq('get', `/api/admin/payouts/${new mongoose.Types.ObjectId()}`)).status).toBe(404);
    expect((await adminReq('post', '/api/admin/payouts/generate', { periodEnd: 'not a date' })).status).toBe(400);
  });
});
