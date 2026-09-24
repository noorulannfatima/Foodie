import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import User from '../src/models/user';
import Restaurant from '../src/models/restaurant';
import DeliveryPerson from '../src/models/deliveryperson';
import Menu from '../src/models/menu';
import Order from '../src/models/order';
import Review from '../src/models/review';
import * as push from '../src/services/push.service';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Review.init(); // unique index on `order` must exist before the duplicate tests
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

let seq = 0;

async function createCustomer(name = 'Ayesha Khan') {
  seq += 1;
  return User.create({ name, email: `customer${seq}@test.com`, password: 'password123' });
}

async function createWorld(options: { withRider?: boolean; status?: string } = {}) {
  const { withRider = true, status = 'Delivered' } = options;
  seq += 1;

  const customer = await createCustomer();
  const restaurant = await Restaurant.create({
    name: 'Karachi Kitchen',
    email: `restaurant${seq}@test.com`,
    password: 'password123',
    description: 'Home-style Pakistani food',
    phone: '0300 1234567',
    address: { street: '1 Main St', city: 'Karachi', zipCode: '74000' },
    cuisineTypes: ['Pakistani'],
  });
  const rider = withRider
    ? await DeliveryPerson.create({
        name: 'Bilal',
        email: `rider${seq}@test.com`,
        password: 'password123',
        phone: `0311 00000${seq}`,
        vehicle: { type: 'Bike', plateNumber: 'KHI-123' },
        licenseNumber: 'LIC123',
      })
    : null;

  const menu = await Menu.create({
    restaurant: restaurant._id,
    categories: [{ name: 'Mains' }],
    items: [
      { name: 'Biryani', description: 'Chicken biryani', price: 500, category: 'Mains' },
      { name: 'Karahi', description: 'Mutton karahi', price: 900, category: 'Mains' },
    ],
  });
  const [biryani, karahi] = menu.items.map((item) => item._id!);

  const order = await Order.create({
    customer: customer._id,
    restaurant: restaurant._id,
    deliveryPerson: rider?._id,
    items: [
      { menuItem: biryani, name: 'Biryani', quantity: 1, price: 500 },
      // Same dish again with a customization: still rated once
      {
        menuItem: biryani,
        name: 'Biryani',
        quantity: 1,
        price: 550,
        customizations: [{ name: 'Extra', selectedOptions: [{ name: 'Raita', price: 50 }] }],
      },
      { menuItem: karahi, name: 'Karahi', quantity: 1, price: 900 },
    ],
    deliveryAddress: { street: '2 Side St', city: 'Karachi', zipCode: '74000' },
    pricing: { subtotal: 1950, deliveryFee: 0, tax: 0, total: 1950 },
    payment: { method: 'Cash' },
    status,
    estimatedPreparationTime: 20,
    estimatedDeliveryTime: new Date(),
  });

  return {
    customer,
    restaurant,
    rider,
    order,
    biryani: biryani.toString(),
    karahi: karahi.toString(),
    customerToken: generateToken(customer._id.toString(), 'customer'),
    restaurantToken: generateToken(restaurant._id.toString(), 'restaurant'),
    riderToken: rider ? generateToken(rider._id.toString(), 'delivery') : '',
  };
}

type World = Awaited<ReturnType<typeof createWorld>>;

function validBody(w: World, ratings = { biryani: 5, karahi: 4, delivery: 3 }) {
  return {
    items: [
      { menuItem: w.biryani, rating: ratings.biryani, comment: '  Perfectly spiced  ' },
      { menuItem: w.karahi, rating: ratings.karahi, comment: '   ' },
    ],
    ...(w.rider ? { delivery: { rating: ratings.delivery, comment: 'Fast' } } : {}),
  };
}

function submit(w: World, body: unknown, token = w.customerToken) {
  return request(app)
    .post(`/api/customer/orders/${w.order._id}/review`)
    .set('Authorization', `Bearer ${token}`)
    .send(body as object);
}

// ---------------------------------------------------------------------------
// POST /api/customer/orders/:id/review
// ---------------------------------------------------------------------------

describe('POST /api/customer/orders/:id/review', () => {
  it('stores the review and updates dish, restaurant and rider ratings', async () => {
    const w = await createWorld();

    const res = await submit(w, validBody(w));

    expect(res.status).toBe(201);
    expect(res.body.review.customerFirstName).toBe('Ayesha');
    expect(res.body.review.items).toEqual([
      { menuItem: w.biryani, name: 'Biryani', rating: 5, comment: 'Perfectly spiced' },
      { menuItem: w.karahi, name: 'Karahi', rating: 4 }, // blank comment dropped
    ]);
    expect(res.body.review.delivery).toEqual({ rating: 3, comment: 'Fast' });

    const menu = await Menu.findOne({ restaurant: w.restaurant._id }).lean();
    const byName = Object.fromEntries(menu!.items.map((i) => [i.name, i]));
    expect(byName.Biryani).toMatchObject({ ratingSum: 5, ratingCount: 1 });
    expect(byName.Karahi).toMatchObject({ ratingSum: 4, ratingCount: 1 });

    const restaurant = await Restaurant.findById(w.restaurant._id).lean();
    expect(restaurant).toMatchObject({ averageRating: 4.5, totalReviews: 2 });

    const rider = await DeliveryPerson.findById(w.rider!._id).lean();
    expect(rider!.stats).toMatchObject({ averageRating: 3, totalRatings: 1 });

    expect(push.notifyRestaurant).toHaveBeenCalledWith(
      w.restaurant._id,
      'reviews',
      expect.objectContaining({ title: 'New 4.5-star review' }),
    );
  });

  it('averages across several orders', async () => {
    const w = await createWorld();
    await submit(w, validBody(w, { biryani: 5, karahi: 4, delivery: 5 })).expect(201);

    const second = await Order.create({
      ...w.order.toObject(),
      _id: undefined,
      orderNumber: undefined,
      timeline: [],
    });
    await request(app)
      .post(`/api/customer/orders/${second._id}/review`)
      .set('Authorization', `Bearer ${w.customerToken}`)
      .send(validBody(w, { biryani: 2, karahi: 4, delivery: 2 }))
      .expect(201);

    const restaurant = await Restaurant.findById(w.restaurant._id).lean();
    expect(restaurant).toMatchObject({ averageRating: 3.8, totalReviews: 4 }); // 15 / 4 = 3.75
    const rider = await DeliveryPerson.findById(w.rider!._id).lean();
    expect(rider!.stats).toMatchObject({ averageRating: 3.5, totalRatings: 2 });
  });

  it('accepts an order without a rider when no delivery rating is sent', async () => {
    const w = await createWorld({ withRider: false });
    const res = await submit(w, validBody(w));
    expect(res.status).toBe(201);
    expect(res.body.review.delivery).toBeUndefined();
  });

  it('rejects orders that are not delivered', async () => {
    const w = await createWorld({ status: 'OutForDelivery' });
    const res = await submit(w, validBody(w));
    expect(res.status).toBe(409);
  });

  it('rejects a second review of the same order', async () => {
    const w = await createWorld();
    await submit(w, validBody(w)).expect(201);
    const res = await submit(w, validBody(w));
    expect(res.status).toBe(409);
    expect(await Review.countDocuments()).toBe(1);
  });

  it("returns 404 for another customer's order", async () => {
    const w = await createWorld();
    const other = await createCustomer('Someone Else');
    const res = await submit(w, validBody(w), generateToken(other._id.toString(), 'customer'));
    expect(res.status).toBe(404);
  });

  it('rejects non-customer roles', async () => {
    const w = await createWorld();
    const res = await submit(w, validBody(w), w.restaurantToken);
    expect(res.status).toBe(403);
  });

  it('rejects an invalid order id', async () => {
    const w = await createWorld();
    const res = await request(app)
      .post('/api/customer/orders/not-an-id/review')
      .set('Authorization', `Bearer ${w.customerToken}`)
      .send(validBody(w));
    expect(res.status).toBe(400);
  });

  describe('body validation (400)', () => {
    const cases: Array<[string, (w: World) => unknown]> = [
      ['items is missing', (w) => ({ delivery: { rating: 5 } })],
      ['a dish is missing', (w) => ({ ...validBody(w), items: [{ menuItem: w.biryani, rating: 5 }] })],
      [
        'a dish is not in the order',
        (w) => ({
          ...validBody(w),
          items: [...validBody(w).items, { menuItem: new mongoose.Types.ObjectId().toString(), rating: 5 }],
        }),
      ],
      [
        'a dish is rated twice',
        (w) => ({ ...validBody(w), items: [...validBody(w).items, { menuItem: w.biryani, rating: 3 }] }),
      ],
      ['a rating is 0', (w) => ({ ...validBody(w), items: [{ menuItem: w.biryani, rating: 0 }, { menuItem: w.karahi, rating: 4 }] })],
      ['a rating is 6', (w) => ({ ...validBody(w), items: [{ menuItem: w.biryani, rating: 6 }, { menuItem: w.karahi, rating: 4 }] })],
      ['a rating is 3.5', (w) => ({ ...validBody(w), items: [{ menuItem: w.biryani, rating: 3.5 }, { menuItem: w.karahi, rating: 4 }] })],
      ['a rating is a string', (w) => ({ ...validBody(w), items: [{ menuItem: w.biryani, rating: '5' }, { menuItem: w.karahi, rating: 4 }] })],
      [
        'a comment is too long',
        (w) => ({
          ...validBody(w),
          items: [{ menuItem: w.biryani, rating: 5, comment: 'x'.repeat(501) }, { menuItem: w.karahi, rating: 4 }],
        }),
      ],
      ['the delivery rating is missing', (w) => ({ items: validBody(w).items })],
      ['the delivery rating is invalid', (w) => ({ ...validBody(w), delivery: { rating: 9 } })],
    ];

    it.each(cases)('when %s', async (_label, makeBody) => {
      const w = await createWorld();
      const res = await submit(w, makeBody(w));
      expect(res.status).toBe(400);
      expect(await Review.countDocuments()).toBe(0);
    });

    it('when a delivery rating is sent for an order without a rider', async () => {
      const w = await createWorld({ withRider: false });
      const res = await submit(w, { ...validBody(w), delivery: { rating: 5 } });
      expect(res.status).toBe(400);
    });
  });
});

// ---------------------------------------------------------------------------
// Reading reviews
// ---------------------------------------------------------------------------

describe('GET /api/customer/orders and /orders/:id', () => {
  it('flags whether each order has been reviewed', async () => {
    const w = await createWorld();

    let detail = await request(app)
      .get(`/api/customer/orders/${w.order._id}`)
      .set('Authorization', `Bearer ${w.customerToken}`);
    expect(detail.body.order.isReviewed).toBe(false);

    await submit(w, validBody(w)).expect(201);

    detail = await request(app)
      .get(`/api/customer/orders/${w.order._id}`)
      .set('Authorization', `Bearer ${w.customerToken}`);
    expect(detail.body.order.isReviewed).toBe(true);

    const list = await request(app)
      .get('/api/customer/orders')
      .set('Authorization', `Bearer ${w.customerToken}`);
    expect(list.body.orders[0]).toMatchObject({ isReviewed: true, deliveryPerson: { name: 'Bilal' } });
  });
});

describe('GET /api/customer/restaurants/:id', () => {
  it('exposes per-dish averages but not the raw totals', async () => {
    const w = await createWorld();
    await submit(w, validBody(w)).expect(201);

    const res = await request(app)
      .get(`/api/customer/restaurants/${w.restaurant._id}`)
      .set('Authorization', `Bearer ${w.customerToken}`);

    const biryani = res.body.menu.items.find((i: any) => i.name === 'Biryani');
    expect(biryani).toMatchObject({ averageRating: 5, ratingCount: 1 });
    expect(biryani.ratingSum).toBeUndefined();
    expect(res.body.menu.menuByCategory.Mains[0].averageRating).toBeDefined();
  });
});

describe('GET /restaurant/reviews', () => {
  it("lists only the restaurant's dish reviews, newest first, paginated", async () => {
    const w = await createWorld();
    await submit(w, validBody(w)).expect(201);
    const otherWorld = await createWorld();
    await submit(otherWorld, validBody(otherWorld)).expect(201);

    const res = await request(app)
      .get('/restaurant/reviews?limit=1')
      .set('Authorization', `Bearer ${w.restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary).toEqual({ averageRating: 4.5, totalReviews: 2 });
    expect(res.body.pagination).toEqual({ page: 1, limit: 1, total: 2, pages: 2 });
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0]).toMatchObject({
      dishName: 'Biryani',
      rating: 5,
      comment: 'Perfectly spiced',
      customerFirstName: 'Ayesha',
    });

    const page2 = await request(app)
      .get('/restaurant/reviews?limit=1&page=2')
      .set('Authorization', `Bearer ${w.restaurantToken}`);
    expect(page2.body.reviews[0]).toMatchObject({ dishName: 'Karahi', rating: 4 });
  });

  it('is restricted to restaurants', async () => {
    const w = await createWorld();
    const res = await request(app)
      .get('/restaurant/reviews')
      .set('Authorization', `Bearer ${w.customerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/delivery/reviews', () => {
  it("lists only the rider's ratings with order numbers", async () => {
    const w = await createWorld();
    await submit(w, validBody(w)).expect(201);
    const otherWorld = await createWorld();
    await submit(otherWorld, validBody(otherWorld)).expect(201);

    const res = await request(app)
      .get('/api/delivery/reviews')
      .set('Authorization', `Bearer ${w.riderToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary).toEqual({ averageRating: 3, totalRatings: 1 });
    expect(res.body.reviews).toEqual([
      expect.objectContaining({
        rating: 3,
        comment: 'Fast',
        customerFirstName: 'Ayesha',
        orderNumber: w.order.orderNumber,
      }),
    ]);
  });
});

describe('menu item rating fields', () => {
  it('cannot be set by the restaurant', async () => {
    const w = await createWorld();
    const res = await request(app)
      .put(`/restaurant/menu/item/${w.biryani}`)
      .set('Authorization', `Bearer ${w.restaurantToken}`)
      .send({ price: 600, ratingSum: 500, ratingCount: 100 });

    expect(res.status).toBe(200);
    const menu = await Menu.findOne({ restaurant: w.restaurant._id }).lean();
    const biryani = menu!.items.find((i) => i.name === 'Biryani')!;
    expect(biryani).toMatchObject({ price: 600, ratingSum: 0, ratingCount: 0 });
  });
});
