import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import User from '../src/models/user';
import Menu from '../src/models/menu';
import Review from '../src/models/review';
import { makeRestaurant } from './helpers/payoutFixtures';

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

let token: string;
beforeEach(async () => {
  const customer = await User.create({ name: 'Ayesha Khan', email: 'dish@test.com', password: 'password123' });
  token = `Bearer ${generateToken(String(customer._id), 'customer')}`;
});

const get = (path: string) => request(app).get(path).set('Authorization', token);

async function makeWorld() {
  const restaurant = await makeRestaurant({ name: 'Beef House' });
  const menu = await Menu.create({
    restaurant: restaurant._id,
    categories: [{ name: 'BBQ' }],
    items: [
      {
        name: 'Seekh Kebab',
        description: 'Charcoal grilled',
        price: 950,
        discountedPrice: 850,
        category: 'BBQ',
        preparationTime: 20,
        ratingSum: 14,
        ratingCount: 3,
      },
      { name: 'Tikka', description: 'Chicken tikka', price: 700, category: 'BBQ', preparationTime: 15 },
    ],
  });
  const [kebab, tikka] = menu.items;
  return { restaurant, kebabId: kebab._id!.toString(), tikkaId: tikka._id!.toString() };
}

/** One order's review; `dishes` rates each [menuItemId, rating, comment?]. */
async function review(
  restaurantId: mongoose.Types.ObjectId,
  firstName: string,
  dishes: Array<[string, number, string?]>,
  daysAgo = 0,
) {
  const doc = await Review.create({
    order: new mongoose.Types.ObjectId(),
    customer: new mongoose.Types.ObjectId(),
    customerFirstName: firstName,
    restaurant: restaurantId,
    items: dishes.map(([menuItem, rating, comment]) => ({ menuItem, name: 'dish', rating, comment })),
  });
  if (daysAgo) {
    await Review.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt: new Date(Date.now() - daysAgo * 86400000) } },
    );
  }
}

describe('GET /api/customer/restaurants/:id/items/:itemId', () => {
  it('returns the dish, its restaurant and a review summary', async () => {
    const { restaurant, kebabId, tikkaId } = await makeWorld();
    await review(restaurant._id, 'Ayesha', [[kebabId, 5, 'Smoky and juicy'], [tikkaId, 2, 'Dry']], 3);
    await review(restaurant._id, 'Hamza', [[kebabId, 4]], 2);
    await review(restaurant._id, 'Sana', [[kebabId, 5, 'Great value']], 1);
    await review(restaurant._id, 'Usman', [[kebabId, 3, 'Arrived cold']]);
    await review(restaurant._id, 'Zara', [[tikkaId, 5, 'Lovely']]);

    const res = await get(`/api/customer/restaurants/${restaurant._id}/items/${kebabId}`);
    expect(res.status).toBe(200);
    expect(res.body.item).toMatchObject({
      _id: kebabId,
      name: 'Seekh Kebab',
      price: 950,
      discountedPrice: 850,
      averageRating: 4.7,
      ratingCount: 3,
    });
    expect(res.body.item.ratingSum).toBeUndefined();
    expect(res.body.restaurant).toEqual({
      _id: restaurant._id.toString(),
      name: 'Beef House',
      isActive: true,
      isBusy: false,
    });
    expect(res.body.reviews.breakdown).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 });
    expect(res.body.reviews.writtenCount).toBe(3);
    // Newest first, written reviews only, at most three.
    expect(res.body.reviews.latest.map((r: any) => [r.customerFirstName, r.rating, r.comment])).toEqual([
      ['Usman', 3, 'Arrived cold'],
      ['Sana', 5, 'Great value'],
      ['Ayesha', 5, 'Smoky and juicy'],
    ]);
    expect(res.body.reviews.latest[0]).toEqual({
      id: expect.any(String),
      customerFirstName: 'Usman',
      rating: 3,
      comment: 'Arrived cold',
      createdAt: expect.any(String),
    });
  });

  it('returns an empty summary for a dish nobody has reviewed', async () => {
    const { restaurant, tikkaId } = await makeWorld();
    const res = await get(`/api/customer/restaurants/${restaurant._id}/items/${tikkaId}`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toEqual({ breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, writtenCount: 0, latest: [] });
  });

  it('404s for an unknown dish or restaurant', async () => {
    const { restaurant, kebabId } = await makeWorld();
    const other = await makeRestaurant();
    const missing = new mongoose.Types.ObjectId().toString();
    expect((await get(`/api/customer/restaurants/${restaurant._id}/items/${missing}`)).status).toBe(404);
    expect((await get(`/api/customer/restaurants/${other._id}/items/${kebabId}`)).status).toBe(404);
    expect((await get(`/api/customer/restaurants/nope/items/${kebabId}`)).status).toBe(404);
  });
});

describe('GET /api/customer/restaurants/:id/items/:itemId/reviews', () => {
  it('pages through written reviews, newest first, optionally by star rating', async () => {
    const { restaurant, kebabId } = await makeWorld();
    await review(restaurant._id, 'A', [[kebabId, 5, 'one']], 5);
    await review(restaurant._id, 'B', [[kebabId, 4, 'two']], 4);
    await review(restaurant._id, 'C', [[kebabId, 5]], 3);
    await review(restaurant._id, 'D', [[kebabId, 5, 'four']], 2);
    await review(restaurant._id, 'E', [[kebabId, 1, 'five']], 1);

    const base = `/api/customer/restaurants/${restaurant._id}/items/${kebabId}/reviews`;
    const first = await get(`${base}?limit=2`);
    expect(first.status).toBe(200);
    expect(first.body.reviews.map((r: any) => r.customerFirstName)).toEqual(['E', 'D']);
    expect(first.body.pagination).toEqual({ page: 1, limit: 2, total: 4, pages: 2 });

    const second = await get(`${base}?limit=2&page=2`);
    expect(second.body.reviews.map((r: any) => r.customerFirstName)).toEqual(['B', 'A']);

    const fives = await get(`${base}?rating=5`);
    expect(fives.body.reviews.map((r: any) => r.customerFirstName)).toEqual(['D', 'A']);
    expect(fives.body.pagination.total).toBe(2);
  });

  it('rejects a bad rating filter and unknown dishes', async () => {
    const { restaurant, kebabId } = await makeWorld();
    const base = `/api/customer/restaurants/${restaurant._id}/items`;
    expect((await get(`${base}/${kebabId}/reviews?rating=6`)).status).toBe(400);
    expect((await get(`${base}/${new mongoose.Types.ObjectId()}/reviews`)).status).toBe(404);
  });
});
