import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Menu from '../models/menu';
import Restaurant from '../models/restaurant';
import { uploadImage } from '../services/cloudinary.service';

/**
 * One-off migration: find images stored inline as base64 data URIs (menu items,
 * restaurant banners and logos), upload them to Cloudinary and replace them with
 * the hosted URL. Safe to re-run — anything that is already a URL is skipped.
 *
 * Usage: npm run migrate:images
 */

const isDataUri = (value?: string | null): value is string =>
  typeof value === 'string' && value.startsWith('data:image/');

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI);

  let uploaded = 0;

  for (const restaurant of await Restaurant.find()) {
    const id = restaurant._id.toString();
    let changed = false;

    for (let i = 0; i < restaurant.image.length; i++) {
      if (!isDataUri(restaurant.image[i])) continue;
      restaurant.image[i] = (await uploadImage(restaurant.image[i], `restaurant/${id}/restaurant`)).url;
      changed = true;
      uploaded++;
    }

    if (isDataUri(restaurant.logo)) {
      restaurant.logo = (await uploadImage(restaurant.logo, `restaurant/${id}/logo`)).url;
      changed = true;
      uploaded++;
    }

    if (changed) {
      await restaurant.save();
      console.log(`✔ ${restaurant.name}: restaurant images migrated`);
    }

    const menu = await Menu.findOne({ restaurant: restaurant._id });
    if (!menu) continue;

    let menuChanged = false;
    for (const item of menu.items) {
      for (let i = 0; i < item.image.length; i++) {
        if (!isDataUri(item.image[i])) continue;
        item.image[i] = (await uploadImage(item.image[i], `restaurant/${id}/menu`)).url;
        menuChanged = true;
        uploaded++;
        console.log(`✔ ${restaurant.name} → ${item.name}`);
      }
    }

    if (menuChanged) {
      menu.markModified('items');
      await menu.save();
    }
  }

  console.log(`Done. Uploaded ${uploaded} image(s) to Cloudinary.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
