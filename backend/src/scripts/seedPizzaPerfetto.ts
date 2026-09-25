import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '../models/user';
import Restaurant from '../models/restaurant';
import Menu from '../models/menu';
import Order from '../models/order';
import Review from '../models/review';
import { deleteImage, uploadImage } from '../services/cloudinary.service';
import { recalculateRestaurantRatings } from '../services/rating.service';
import { roundPKR } from '../utils/currency';

/**
 * Seeds the Pizza Perfetto restaurant with a four-dish menu (images uploaded to
 * Cloudinary from frontend/assets), a demo customer, three delivered orders that
 * each carry a review, and one fresh Pending order for the kitchen to accept.
 * Re-running wipes the previous seed (including its Cloudinary images) first.
 *
 * Usage: npm run seed:pizzaperfetto
 */

const PASSWORD = 'Password123!';
const RESTAURANT_EMAIL = 'pizzaperfetto@example.com';
const CUSTOMER_EMAIL = 'sara.customer@example.com';

const ASSETS_DIR = path.resolve(__dirname, '../../../frontend/assets/images/dummy');

const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

const deliveryAddress = {
  street: 'House 27, Street 4, Phase 5, DHA',
  city: 'Lahore',
  zipCode: '54792',
  latitude: 31.4627,
  longitude: 74.4082,
  instructions: 'Call on arrival, gate is locked',
};

const CATEGORIES = [
  { name: 'Main', description: 'Stone-baked pizzas', displayOrder: 0, isAvailable: true },
  { name: 'Pastas', description: 'Fresh pasta, made to order', displayOrder: 1, isAvailable: true },
  { name: 'Salads', description: 'Crisp and light', displayOrder: 2, isAvailable: true },
];

const PIZZA_CUSTOMIZATIONS = [
  {
    name: 'Size',
    isRequired: true,
    maxSelection: 1,
    options: [
      { name: 'Regular (10")', price: 0 },
      { name: 'Large (14")', price: 600 },
    ],
  },
  {
    name: 'Extras',
    isRequired: false,
    maxSelection: 3,
    options: [
      { name: 'Extra Mozzarella', price: 200 },
      { name: 'Black Olives', price: 120 },
      { name: 'Jalapeños', price: 100 },
    ],
  },
];

const DISHES = [
  {
    file: 'menu/7.png',
    name: 'Beef Pepperoni Pizza',
    description:
      'Thin, stone-baked crust with San Marzano tomato sauce, stretchy mozzarella and generous slices of halal beef pepperoni.',
    price: 1650,
    category: 'Main',
    tags: ['Pizza', 'Italian', 'Bestseller'],
    isVegetarian: false,
    spiceLevel: 'Medium' as const,
    preparationTime: 20,
    calories: 980,
    customizations: PIZZA_CUSTOMIZATIONS,
  },
  {
    file: 'menu/8.png',
    name: 'Classic Margherita',
    description:
      'The Neapolitan original: tomato sauce, melted mozzarella, a fresh cherry tomato and basil on a blistered hand-stretched base.',
    price: 1350,
    discountedPrice: 1199,
    category: 'Main',
    tags: ['Pizza', 'Italian', 'Vegetarian'],
    isVegetarian: true,
    spiceLevel: 'Mild' as const,
    preparationTime: 18,
    calories: 820,
    customizations: PIZZA_CUSTOMIZATIONS,
  },
  {
    file: 'menu/6.png',
    name: 'Fusilli al Pomodoro',
    description:
      'Fusilli tossed in a slow-cooked tomato and garlic sauce with blistered cherry tomatoes, fresh basil and cracked black pepper.',
    price: 1100,
    category: 'Pastas',
    tags: ['Pasta', 'Italian', 'Vegetarian'],
    isVegetarian: true,
    spiceLevel: 'Mild' as const,
    preparationTime: 15,
    calories: 640,
    customizations: [
      {
        name: 'Add Protein',
        isRequired: false,
        maxSelection: 1,
        options: [
          { name: 'Grilled Chicken', price: 250 },
          { name: 'Beef Meatballs', price: 300 },
        ],
      },
    ],
  },
  {
    file: 'menu/10.png',
    name: 'Garden Parmesan Salad',
    description:
      'Mixed greens, radicchio, red onion, mushrooms, radish and cherry tomatoes with shaved parmesan and a lemon olive oil dressing.',
    price: 850,
    category: 'Salads',
    tags: ['Salad', 'Healthy', 'Vegetarian'],
    isVegetarian: true,
    isGlutenFree: true,
    preparationTime: 10,
    calories: 310,
    customizations: [],
  },
];

type DishName = (typeof DISHES)[number]['name'];

/**
 * Delivered orders, newest first. Each gets a review with one rating per dish
 * (the Review model allows one rating per distinct dish).
 */
const DELIVERED_ORDERS: Array<{
  daysAgo: number;
  tip: number;
  lines: Array<{ name: DishName; quantity: number; rating: number; comment?: string }>;
}> = [
  {
    daysAgo: 1,
    tip: 100,
    lines: [
      {
        name: 'Beef Pepperoni Pizza',
        quantity: 1,
        rating: 5,
        comment: 'Crispy base and loads of pepperoni. Best pizza I have had in DHA.',
      },
      { name: 'Garden Parmesan Salad', quantity: 1, rating: 4, comment: 'Fresh and crunchy, nice dressing.' },
    ],
  },
  {
    daysAgo: 5,
    tip: 0,
    lines: [
      { name: 'Classic Margherita', quantity: 1, rating: 5, comment: 'Simple and perfect, just like in Italy.' },
      {
        name: 'Fusilli al Pomodoro',
        quantity: 1,
        rating: 3,
        comment: 'Tasty sauce but the pasta was a little overcooked.',
      },
    ],
  },
  {
    daysAgo: 9,
    tip: 50,
    lines: [
      { name: 'Beef Pepperoni Pizza', quantity: 1, rating: 4 },
      { name: 'Classic Margherita', quantity: 1, rating: 4, comment: 'Arrived hot, cheese still stretchy.' },
      { name: 'Fusilli al Pomodoro', quantity: 2, rating: 4 },
    ],
  },
];

/** A just-placed order waiting for the restaurant to accept it. */
const PENDING_ORDER = {
  minutesAgo: 4,
  lines: [
    { name: 'Beef Pepperoni Pizza' as DishName, quantity: 2 },
    { name: 'Garden Parmesan Salad' as DishName, quantity: 1 },
  ],
};

function toDataUri(relativeFile: string): string {
  const file = path.join(ASSETS_DIR, relativeFile);
  const ext = path.extname(file).slice(1).replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
}

/** Uploads a local asset, retrying a couple of times since large uploads can time out. */
async function uploadAsset(relativeFile: string, subfolder: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      return (await uploadImage(toDataUri(relativeFile), subfolder)).url;
    } catch (err: any) {
      if (attempt >= 3) throw err;
      console.log(`  retrying ${relativeFile} (${err?.message ?? err?.error?.message ?? err})`);
    }
  }
}

/** Recovers the Cloudinary public id from a delivery URL like ".../v1/foodie/x/y?_a=...". */
function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/v\d+\/([^?]+)/);
  return match ? match[1] : null;
}

async function deleteImages(urls: string[]) {
  for (const url of urls) {
    const publicId = publicIdFromUrl(url);
    if (publicId) await deleteImage(publicId).catch(() => undefined);
  }
}

async function removePreviousSeed() {
  const restaurant = await Restaurant.findOne({ email: RESTAURANT_EMAIL });
  const customer = await User.findOne({ email: CUSTOMER_EMAIL }).select('_id');
  if (!restaurant && !customer) return;

  const orderFilter = {
    $or: [
      ...(restaurant ? [{ restaurant: restaurant._id }] : []),
      ...(customer ? [{ customer: customer._id }] : []),
    ],
  };
  await Review.deleteMany(orderFilter);
  await Order.deleteMany(orderFilter);

  if (restaurant) {
    const menu = await Menu.findOne({ restaurant: restaurant._id });
    await deleteImages([
      ...restaurant.image,
      ...(restaurant.logo ? [restaurant.logo] : []),
      ...(menu?.items.flatMap((item) => item.image) ?? []),
    ]);
    if (menu) await Menu.deleteOne({ _id: menu._id });
    await Restaurant.deleteOne({ _id: restaurant._id });
  }
  if (customer) await User.deleteOne({ _id: customer._id });
  console.log('Removed previous seed data');
}

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  for (const file of ['restaurants/pizza_perfetto.png', ...DISHES.map((d) => d.file)]) {
    if (!fs.existsSync(path.join(ASSETS_DIR, file))) throw new Error(`Missing image ${file}`);
  }
  await mongoose.connect(process.env.MONGO_URI);

  await removePreviousSeed();

  const restaurant = new Restaurant({
    name: 'Pizza Perfetto',
    email: RESTAURANT_EMAIL,
    password: PASSWORD,
    description:
      'Wood-fired Neapolitan pizzas, fresh pasta and crisp salads made with imported Italian flour and San Marzano tomatoes.',
    phone: '+92 42 3571 2233',
    address: {
      street: 'Plot 14, Y Block, Phase 3, DHA',
      city: 'Lahore',
      zipCode: '54792',
      country: 'Pakistan',
    },
    coordinates: { type: 'Point', coordinates: [74.386, 31.472] },
    cuisineTypes: ['Pizza', 'Italian'],
    deliveryOptions: ['Delivery', 'Pickup'],
    paymentMethods: ['Cash', 'Card'],
    deliveryRadius: 8,
    minimumOrder: 500,
    deliveryFee: 99,
    estimatedDeliveryTime: 35,
    isActive: true,
    isVerified: true,
  });
  const restaurantId = restaurant._id.toString();

  console.log('Uploading images to Cloudinary...');
  restaurant.image = [await uploadAsset('restaurants/pizza_perfetto.png', `restaurant/${restaurantId}/restaurant`)];
  await restaurant.save();

  const items = [];
  for (const { file, ...dish } of DISHES) {
    const image = await uploadAsset(file, `restaurant/${restaurantId}/menu`);
    items.push({ ...dish, image: [image], isAvailable: true });
    console.log(`  ✔ ${dish.name}`);
  }
  const menu = await Menu.create({ restaurant: restaurant._id, categories: CATEGORIES, items });
  const dishByName = new Map(menu.items.map((item) => [item.name, item]));

  const customer = await User.create({
    name: 'Sara Khan',
    email: CUSTOMER_EMAIL,
    password: PASSWORD,
    phone: '+92 333 4455667',
    isEmailVerified: true,
    savedAddresses: [
      {
        streetAddress: deliveryAddress.street,
        city: deliveryAddress.city,
        zipCode: deliveryAddress.zipCode,
        country: 'Pakistan',
        latitude: deliveryAddress.latitude,
        longitude: deliveryAddress.longitude,
        instructions: deliveryAddress.instructions,
        isDefault: true,
      },
    ],
  });

  const deliveryFee = restaurant.deliveryFee;
  const prepTime = restaurant.estimatedDeliveryTime;

  function buildItems(lines: Array<{ name: DishName; quantity: number }>) {
    return lines.map(({ name, quantity }) => {
      const dish = dishByName.get(name)!;
      return {
        menuItem: dish._id!,
        name: dish.name,
        quantity,
        price: dish.discountedPrice ?? dish.price,
        customizations: [],
      };
    });
  }

  function buildPricing(orderItems: ReturnType<typeof buildItems>, tip: number) {
    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = roundPKR(subtotal * 0.05);
    return { subtotal, deliveryFee, tax, discount: 0, tip, total: subtotal + deliveryFee + tax + tip };
  }

  const now = Date.now();
  const delivered = [];

  for (const spec of DELIVERED_ORDERS) {
    const placedAt = new Date(now - spec.daysAgo * DAY);
    const at = (minutes: number) => new Date(placedAt.getTime() + minutes * MINUTE);
    const deliveredAt = at(38);
    const orderItems = buildItems(spec.lines);

    const order = new Order({
      customer: customer._id,
      restaurant: restaurant._id,
      items: orderItems,
      deliveryAddress,
      pricing: buildPricing(orderItems, spec.tip),
      payment: { method: 'Cash', status: 'Completed', paidAt: deliveredAt },
      status: 'Delivered',
      timeline: [
        { status: 'Pending', timestamp: placedAt, note: 'Order placed' },
        { status: 'Confirmed', timestamp: at(2), note: 'Order confirmed' },
        { status: 'Preparing', timestamp: at(3), note: 'Order preparing' },
        { status: 'Ready', timestamp: at(21), note: 'Order ready' },
        { status: 'OutForDelivery', timestamp: at(24), note: 'Out for delivery' },
        { status: 'Delivered', timestamp: deliveredAt, note: 'Delivered' },
      ],
      estimatedPreparationTime: prepTime,
      estimatedDeliveryTime: at(prepTime + 15),
      actualDeliveryTime: deliveredAt,
      createdAt: placedAt,
      updatedAt: deliveredAt,
    });
    await order.save({ timestamps: false });
    delivered.push({ order, spec, deliveredAt });
  }

  for (const { order, spec, deliveredAt } of delivered) {
    const reviewedAt = new Date(deliveredAt.getTime() + 45 * MINUTE);
    const review = new Review({
      order: order._id,
      customer: customer._id,
      customerFirstName: 'Sara',
      restaurant: restaurant._id,
      items: spec.lines.map(({ name, rating, comment }) => ({
        menuItem: dishByName.get(name)!._id,
        name,
        rating,
        ...(comment ? { comment } : {}),
      })),
      createdAt: reviewedAt,
      updatedAt: reviewedAt,
    });
    await review.save({ timestamps: false });
  }

  const pendingPlacedAt = new Date(now - PENDING_ORDER.minutesAgo * MINUTE);
  const pendingItems = buildItems(PENDING_ORDER.lines);
  const pending = new Order({
    customer: customer._id,
    restaurant: restaurant._id,
    items: pendingItems,
    deliveryAddress,
    pricing: buildPricing(pendingItems, 0),
    payment: { method: 'Cash', status: 'Pending' },
    status: 'Pending',
    timeline: [{ status: 'Pending', timestamp: pendingPlacedAt, note: 'Order placed' }],
    estimatedPreparationTime: prepTime,
    estimatedDeliveryTime: new Date(pendingPlacedAt.getTime() + (prepTime + 15) * MINUTE),
    createdAt: pendingPlacedAt,
    updatedAt: pendingPlacedAt,
  });
  await pending.save({ timestamps: false });

  await recalculateRestaurantRatings(restaurant._id as mongoose.Types.ObjectId);
  const rated = await Restaurant.findById(restaurant._id).select('averageRating totalReviews');

  console.log(`Restaurant: ${RESTAURANT_EMAIL} / ${PASSWORD}`);
  console.log(`Customer:   ${CUSTOMER_EMAIL} / ${PASSWORD}`);
  for (const { order } of delivered) {
    console.log(`Order ${order.orderNumber}: Rs. ${order.pricing.total} (Delivered, reviewed)`);
  }
  console.log(`Order ${pending.orderNumber}: Rs. ${pending.pricing.total} (Pending)`);
  console.log(`Rating: ${rated?.averageRating} from ${rated?.totalReviews} dish ratings`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Seed failed:', err?.message ?? err?.error?.message ?? err);
  await mongoose.disconnect();
  process.exit(1);
});
