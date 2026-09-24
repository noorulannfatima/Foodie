import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Admin from '../models/admin';

/**
 * Creates a Foodie admin account (there is no admin signup endpoint).
 *
 * Usage: npm run create:admin -- <email> <password> <name>
 */
async function run() {
  const [email, password, ...nameParts] = process.argv.slice(2);
  const name = nameParts.join(' ');
  if (!email || !password || !name) {
    throw new Error('Usage: npm run create:admin -- <email> <password> <name>');
  }
  if (password.length < 6) throw new Error('Password must be at least 6 characters');

  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI);

  if (await Admin.exists({ email: email.toLowerCase().trim() })) {
    throw new Error(`An admin with email ${email} already exists`);
  }

  const admin = await Admin.create({ email, password, name });
  console.log(`✔ Admin created: ${admin.name} <${admin.email}>`);
}

run()
  .catch((error) => {
    console.error(`✖ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
