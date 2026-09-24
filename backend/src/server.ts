// Must be the first import: other modules read process.env at import time
import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 5000;

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