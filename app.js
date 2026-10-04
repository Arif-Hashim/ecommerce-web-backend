require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, ''));
// CLIENT_URL=* allows every website (handy for testing). Use your exact frontend link(s) once everything works.
app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ name: 'SHOP.CO API', ok: true }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// connect to MongoDB on first use (needed for serverless hosting)
app.use(async (req, res, next) => {
  try { await connectDB(); next(); } catch (e) { res.status(503).json({ message: 'Database connection failed. Check MONGO_URI and Atlas Network Access.' }); }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/meta', require('./routes/meta'));
app.use('/api/images', require('./routes/images'));
app.use('/api/placeholder', require('./routes/placeholder'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
