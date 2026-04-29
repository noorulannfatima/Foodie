import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import restaurantRoutes from './routes/restaurant.routes';
import customerRoutes from './routes/customer.routes';
import deliveryRoutes from './routes/delivery.routes';
import paymentRoutes, { webhookRouter as paymentWebhookRouter } from './routes/payment.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANT: mount the Safepay webhook BEFORE express.json() so the raw body
// parser inside the router can see the unmodified bytes for HMAC verification.
app.use('/payments', paymentWebhookRouter);

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/restaurant', restaurantRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGO_URI in .env, skipping DB connection.');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});