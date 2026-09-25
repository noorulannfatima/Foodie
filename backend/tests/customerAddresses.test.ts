import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import User from '../src/models/user';

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

let seq = 0;
async function makeCustomer() {
  seq += 1;
  return User.create({ name: 'Ayesha Khan', email: `addr${seq}@test.com`, password: 'password123' });
}

function as(user: { _id: unknown }, role = 'customer') {
  const auth = `Bearer ${generateToken(String(user._id), role)}`;
  return {
    get: (path: string) => request(app).get(path).set('Authorization', auth),
    post: (path: string, body: object = {}) => request(app).post(path).set('Authorization', auth).send(body),
    patch: (path: string, body: object) => request(app).patch(path).set('Authorization', auth).send(body),
    delete: (path: string) => request(app).delete(path).set('Authorization', auth),
  };
}

const HOME = { label: 'Home', streetAddress: '12 Garden Rd', city: 'Karachi', zipCode: '74000' };
const WORK = { label: 'Work', streetAddress: '5 Office Park', city: 'Karachi', zipCode: '74200' };
const GYM = { label: 'Gym', streetAddress: '9 Fitness Ave', city: 'Lahore', zipCode: '54000' };

/** Labels in the order the API returns them. */
const labels = (res: request.Response) => res.body.addresses.map((a: { label: string }) => a.label);
const defaultLabel = (res: request.Response) =>
  res.body.addresses.find((a: { isDefault: boolean }) => a.isDefault)?.label;

describe('/api/customer/addresses', () => {
  it('starts empty', async () => {
    const res = await as(await makeCustomer()).get('/api/customer/addresses');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ addresses: [] });
  });

  it('makes the first address the default and lists the default first', async () => {
    const api = as(await makeCustomer());

    const first = await api.post('/api/customer/addresses', { ...HOME, instructions: 'Ring twice' });
    expect(first.status).toBe(201);
    expect(first.body.addresses).toEqual([
      {
        _id: expect.any(String),
        ...HOME,
        instructions: 'Ring twice',
        isDefault: true,
      },
    ]);

    await api.post('/api/customer/addresses', WORK);
    const res = await api.post('/api/customer/addresses', GYM);
    expect(labels(res)).toEqual(['Home', 'Gym', 'Work']);
    expect(defaultLabel(res)).toBe('Home');
  });

  it('can add an address as the new default', async () => {
    const api = as(await makeCustomer());
    await api.post('/api/customer/addresses', HOME);
    const res = await api.post('/api/customer/addresses', { ...WORK, isDefault: true });
    expect(labels(res)).toEqual(['Work', 'Home']);
    expect(res.body.addresses.filter((a: { isDefault: boolean }) => a.isDefault)).toHaveLength(1);
  });

  it('does not save the same street, city and zip twice', async () => {
    const api = as(await makeCustomer());
    await api.post('/api/customer/addresses', HOME);
    await api.post('/api/customer/addresses', WORK);
    const res = await api.post('/api/customer/addresses', {
      ...HOME,
      streetAddress: '12 GARDEN RD ',
      label: 'Other',
      isDefault: true,
    });
    expect(res.status).toBe(200);
    expect(labels(res)).toEqual(['Home', 'Work']);
    expect(defaultLabel(res)).toBe('Home');
  });

  it('changes the default', async () => {
    const api = as(await makeCustomer());
    await api.post('/api/customer/addresses', HOME);
    const added = await api.post('/api/customer/addresses', WORK);
    const workId = added.body.addresses.find((a: { label: string }) => a.label === 'Work')._id;

    const res = await api.post(`/api/customer/addresses/${workId}/default`);
    expect(res.status).toBe(200);
    expect(labels(res)).toEqual(['Work', 'Home']);
    expect(defaultLabel(res)).toBe('Work');
  });

  it('edits an address without touching the default', async () => {
    const api = as(await makeCustomer());
    const added = await api.post('/api/customer/addresses', HOME);
    const id = added.body.addresses[0]._id;

    const res = await api.patch(`/api/customer/addresses/${id}`, { streetAddress: '14 Garden Rd', instructions: '' });
    expect(res.status).toBe(200);
    expect(res.body.addresses[0]).toMatchObject({ _id: id, streetAddress: '14 Garden Rd', isDefault: true });
    expect(res.body.addresses[0].instructions).toBeUndefined();
  });

  it('promotes the newest remaining address when the default is deleted', async () => {
    const api = as(await makeCustomer());
    const added = await api.post('/api/customer/addresses', HOME);
    const homeId = added.body.addresses[0]._id;
    await api.post('/api/customer/addresses', WORK);
    await api.post('/api/customer/addresses', GYM);

    const res = await api.delete(`/api/customer/addresses/${homeId}`);
    expect(res.status).toBe(200);
    expect(labels(res)).toEqual(['Gym', 'Work']);
    expect(defaultLabel(res)).toBe('Gym');
  });

  it('rejects missing fields, long labels and unknown ids', async () => {
    const api = as(await makeCustomer());
    expect((await api.post('/api/customer/addresses', { ...HOME, city: ' ' })).status).toBe(400);
    expect((await api.post('/api/customer/addresses', { ...HOME, label: 'x'.repeat(31) })).status).toBe(400);
    expect((await api.patch('/api/customer/addresses/nope', { city: 'Lahore' })).status).toBe(404);
    const missing = new mongoose.Types.ObjectId().toString();
    expect((await api.delete(`/api/customer/addresses/${missing}`)).status).toBe(404);
    expect((await api.post(`/api/customer/addresses/${missing}/default`)).status).toBe(404);
  });

  it('caps saved addresses at 10', async () => {
    const api = as(await makeCustomer());
    for (let i = 0; i < 10; i += 1) {
      const res = await api.post('/api/customer/addresses', { ...HOME, streetAddress: `${i} Garden Rd` });
      expect(res.status).toBe(201);
    }
    const res = await api.post('/api/customer/addresses', HOME);
    expect(res.status).toBe(400);
  });

  it("does not touch another customer's addresses", async () => {
    const owner = as(await makeCustomer());
    const added = await owner.post('/api/customer/addresses', HOME);
    const id = added.body.addresses[0]._id;

    const other = as(await makeCustomer());
    expect((await other.delete(`/api/customer/addresses/${id}`)).status).toBe(404);
    expect(labels(await owner.get('/api/customer/addresses'))).toEqual(['Home']);
  });

  it('is for customers only', async () => {
    const res = await as(await makeCustomer(), 'restaurant').get('/api/customer/addresses');
    expect(res.status).toBe(403);
  });
});

describe('savedAddresses default rule', () => {
  it('keeps exactly one default when several are flagged', async () => {
    const user = await makeCustomer();
    user.savedAddresses = [
      { ...HOME, isDefault: false },
      { ...WORK, isDefault: true },
      { ...GYM, isDefault: true },
    ] as any;
    await user.save();
    expect(user.savedAddresses.map((a) => a.isDefault)).toEqual([false, true, false]);
  });
});
