/**
 * Express app without a DB connection or listener, so tests can import it.
 * The entry point is server.ts.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import restaurantRoutes from './routes/restaurant.routes';
import customerRoutes from './routes/customer.routes';
import deliveryRoutes from './routes/delivery.routes';
import paymentRoutes, { webhookRouter as paymentWebhookRouter } from './routes/payment.routes';
import uploadRoutes from './routes/upload.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// IMPORTANT: mount the Safepay webhook BEFORE express.json() so the raw body
// parser inside the router can see the unmodified bytes for HMAC verification.
app.use('/payments', paymentWebhookRouter);

// Raised limit so base64 image uploads (see /upload/image) fit in the JSON body.
app.use(express.json({ limit: '8mb' }));
app.use(cors());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/restaurant', restaurantRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;
