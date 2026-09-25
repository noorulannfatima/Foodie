import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { generateToken } from '../src/middleware/auth';
import User from '../src/models/user';
import Menu from '../src/models/menu';
import Order from '../src/models/order';
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

let seq = 0;
async function makeCustomer() {
  seq += 1;
  return User.create({ name: 'Ayesha Khan', email: `suggest${seq}@test.com`, password: 'password123' });
}

function getSuggestions(user: { _id: unknown }) {
  return request(app)
    .get('/api/customer/cart/suggestions')
    .set('Authorization', `Bearer ${generateToken(String(user._id), 'customer')}`);
}

/** A restaurant with a menu of the given dishes; returns the restaurant and item ids by name. */
async function makeRestaurantWithMenu(
  dishes: Array<{ name: string; price: number; discountedPrice?: number; isAvailable?: boolean; image?: string[] }>,
  overrides: Record<string, unknown> = {},
) {
  const restaurant = await makeRestaurant(overrides);
  const menu = await Menu.create({
    restaurant: restaurant._id,
    categories: [{ name: 'Mains' }],
    items: dishes.map((d) => ({ description: 'Tasty', category: 'Mains', preparationTime: 15, ...d })),
  });
  const ids: Record<string, mongoose.Types.ObjectId> = {};
  for (const item of menu.items) ids[item.name] = item._id!;
  return { restaurant, ids };
}

type HasId = { _id: mongoose.Types.ObjectId };

async function placeOrder(
  customer: HasId,
  restaurant: HasId,
  items: Array<{ menuItem: mongoose.Types.ObjectId; name: string; quantity?: number }>,
  opts: { status?: string; createdAt?: Date } = {},
) {
  seq += 1;
  const order = await Order.create({
    orderNumber: `ORD-S${seq}`,
    customer: customer._id,
    restaurant: restaurant._id,
    items: items.map((i) => ({ quantity: 1, price: 500, ...i })),
    deliveryAddress: { street: '2 Side St', city: 'Karachi', zipCode: '74000' },
    pricing: { subtotal: 500, deliveryFee: 100, tax: 25, total: 625 },
    payment: { method: 'Cash', status: 'Completed' },
    status: opts.status ?? 'Delivered',
    estimatedPreparationTime: 20,
    estimatedDeliveryTime: new Date(),
  });
  if (opts.createdAt) {
    await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt: opts.createdAt } });
  }
  return order;
}

describe('GET /api/customer/cart/suggestions', () => {
  it('returns nothing for a customer when nobody has ordered yet', async () => {
    const res = await getSuggestions(await makeCustomer());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ lastOrder: null, popularItems: [] });
  });

  it("returns the customer's most recent delivered order", async () => {
    const customer = await makeCustomer();
    const other = await makeCustomer();
    const { restaurant, ids } = await makeRestaurantWithMenu([
      { name: 'Biryani', price: 500 },
      { name: 'Karahi', price: 900 },
    ]);

    await placeOrder(customer, restaurant, [{ menuItem: ids.Biryani, name: 'Biryani' }], {
      createdAt: new Date(Date.now() - 3 * 86400000),
    });
    const latest = await placeOrder(
      customer,
      restaurant,
      [
        { menuItem: ids.Karahi, name: 'Karahi', quantity: 2 },
        { menuItem: ids.Biryani, name: 'Biryani' },
      ],
      { createdAt: new Date(Date.now() - 86400000) },
    );
    // Newer, but not delivered — and someone else's order — neither counts.
    await placeOrder(customer, restaurant, [{ menuItem: ids.Biryani, name: 'Biryani' }], { status: 'Cancelled' });
    await placeOrder(other, restaurant, [{ menuItem: ids.Biryani, name: 'Biryani' }]);

    const res = await getSuggestions(customer);
    expect(res.status).toBe(200);
    expect(res.body.lastOrder).toMatchObject({
      _id: latest._id.toString(),
      orderNumber: latest.orderNumber,
      total: 625,
      restaurant: { _id: restaurant._id.toString(), name: restaurant.name },
      items: [
        { name: 'Karahi', quantity: 2 },
        { name: 'Biryani', quantity: 1 },
      ],
    });
  });

  it('ranks dishes by how many recent orders included them, across all customers', async () => {
    const [a, b, c] = [await makeCustomer(), await makeCustomer(), await makeCustomer()];
    const { restaurant, ids } = await makeRestaurantWithMenu([
      { name: 'Biryani', price: 500, discountedPrice: 450, image: ['https://img/biryani.jpg'] },
      { name: 'Karahi', price: 900 },
      { name: 'Nihari', price: 700, isAvailable: false },
      { name: 'Haleem', price: 600 },
    ]);
    const closed = await makeRestaurantWithMenu([{ name: 'Burger', price: 800 }], { isActive: false });

    const biryani = { menuItem: ids.Biryani, name: 'Biryani' };
    const karahi = { menuItem: ids.Karahi, name: 'Karahi' };
    await placeOrder(a, restaurant, [biryani, karahi]);
    await placeOrder(b, restaurant, [biryani]);
    await placeOrder(c, restaurant, [{ ...karahi, quantity: 5 }]);
    await placeOrder(a, restaurant, [biryani]);
    // Excluded: unavailable dish, closed restaurant, cancelled order, order older than 30 days.
    await placeOrder(a, restaurant, [{ menuItem: ids.Nihari, name: 'Nihari' }]);
    await placeOrder(b, closed.restaurant, [{ menuItem: closed.ids.Burger, name: 'Burger' }]);
    await placeOrder(c, restaurant, [{ menuItem: ids.Haleem, name: 'Haleem' }], { status: 'Cancelled' });
    await placeOrder(c, restaurant, [{ menuItem: ids.Haleem, name: 'Haleem' }], {
      createdAt: new Date(Date.now() - 45 * 86400000),
    });

    const res = await getSuggestions(a);
    expect(res.status).toBe(200);
    expect(res.body.popularItems).toEqual([
      {
        menuItem: ids.Biryani.toString(),
        name: 'Biryani',
        price: 450,
        image: 'https://img/biryani.jpg',
        orderCount: 3,
        restaurant: { _id: restaurant._id.toString(), name: restaurant.name },
      },
      {
        menuItem: ids.Karahi.toString(),
        name: 'Karahi',
        price: 900,
        image: null,
        orderCount: 2,
        restaurant: { _id: restaurant._id.toString(), name: restaurant.name },
      },
    ]);
  });
});
