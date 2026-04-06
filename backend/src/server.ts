import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Database Connection
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGO_URI in .env, skipping DB connection.');
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
