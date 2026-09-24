import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Restaurant from '../models/restaurant';
import DeliveryPerson from '../models/deliveryperson';
import {
  recalculateDeliveryRating,
  recalculateRestaurantRatings,
} from '../services/rating.service';

/**
 * Rebuilds every rating aggregate (menu items, restaurants, delivery persons)
 * from the Review collection. Aggregates normally refresh on each new review;
 * run this if they ever look wrong. Safe to re-run.
 *
 * Usage: npm run recalculate:ratings
 */
async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI);

  const restaurants = await Restaurant.find().select('_id name').lean();
  for (const restaurant of restaurants) {
    await recalculateRestaurantRatings(restaurant._id);
    console.log(`✔ ${restaurant.name}`);
  }

  const deliveryPersons = await DeliveryPerson.find().select('_id').lean();
  for (const deliveryPerson of deliveryPersons) {
    await recalculateDeliveryRating(deliveryPerson._id);
  }

  console.log(
    `Done. Recalculated ${restaurants.length} restaurant(s) and ${deliveryPersons.length} delivery person(s).`,
  );
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Recalculation failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
