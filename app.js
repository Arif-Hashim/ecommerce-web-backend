require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
// Allow every website to call this API. Login uses a token (not cookies), so this is safe for this project.
app.use(cors());
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
