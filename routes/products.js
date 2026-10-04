const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const { escapeRegex, toArray, fail, recalcRating } = require('../utils/helpers');

const list = (v) => String(v).split(',').map((s) => s.trim()).filter(Boolean);
const SORTS = {
  popular: { reviews: -1, rating: -1 },
  newest: { createdAt: -1 },
  rating: { rating: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
};

// GET /api/products?category=&style=&color=&size=&minPrice=&maxPrice=&search=&section=&sort=&page=&limit=
router.get('/', asyncHandler(async (req, res) => {
  const { category, style, section, color, size, minPrice, maxPrice, search, sort = 'popular' } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 9));
  const q = {};
  if (category) q.category = { $in: list(category) };
  if (style) q.style = { $in: list(style).map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) };
  if (section) q.section = section;
  if (color) q.colors = { $in: list(color) };
  if (size) q.sizes = { $in: list(size) };
  if (minPrice || maxPrice) {
    q.price = {};
    if (minPrice) q.price.$gte = Number(minPrice);
    if (maxPrice) q.price.$lte = Number(maxPrice);
  }
  if (search) q.name = { $regex: escapeRegex(search), $options: 'i' };

  const total = await Product.countDocuments(q);
  const products = await Product.find(q)
    .sort({ ...(SORTS[sort] || SORTS.popular), _id: 1 })
    .skip((page - 1) * limit).limit(limit);
  res.json({ products, total, page, pages: Math.ceil(total / limit) || 1 });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) fail(res, 404, 'Product not found');
  res.json(product);
}));

router.get('/:id/related', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) fail(res, 404, 'Product not found');
  const products = await Product.find({ _id: { $ne: product._id }, category: product.category }).limit(4);
  res.json({ products });
}));

// ---------- reviews ----------
router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 6);
  const filter = { product: req.params.id };
  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  res.json({ reviews, total, page, pages: Math.ceil(total / limit) || 1 });
}));

router.post('/:id/reviews', protect, asyncHandler(async (req, res) => {
  const { rating, text } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) fail(res, 404, 'Product not found');
  if (await Review.exists({ product: product._id, user: req.user._id })) fail(res, 409, 'You already reviewed this product');
  const verified = !!(await Order.exists({ user: req.user._id, 'items.product': product._id, status: { $ne: 'cancelled' } }));
  const review = await Review.create({ product: product._id, user: req.user._id, name: req.user.name, rating: Number(rating), text, verified });
  await recalcRating(product._id);
  res.status(201).json(review);
}));

router.delete('/:id/reviews/:reviewId', protect, asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.reviewId, product: req.params.id });
  if (!review) fail(res, 404, 'Review not found');
  const isOwner = review.user && String(review.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') fail(res, 403, 'Not allowed');
  await review.deleteOne();
  await recalcRating(req.params.id);
  res.json({ message: 'Review deleted' });
}));

// ---------- admin: create / update / delete (multipart, field name "images") ----------
const fromBody = (b) => {
  const d = {};
  ['name', 'category', 'style', 'description', 'section'].forEach((k) => { if (b[k] !== undefined) d[k] = b[k]; });
  ['price', 'oldPrice', 'discount', 'stock'].forEach((k) => {
    if (b[k] !== undefined && b[k] !== '') d[k] = Number(b[k]);
    else if (k === 'oldPrice' && b[k] === '') d[k] = null;
  });
  if (b.colors !== undefined) d.colors = toArray(b.colors);
  if (b.sizes !== undefined) d.sizes = toArray(b.sizes);
  return d;
};
const filesToPaths = (files = []) => files.map((f) => `/uploads/products/${f.filename}`);
const removeFile = (p) => {
  if (!p || !p.startsWith('/uploads/')) return;
  fs.unlink(path.join(__dirname, '..', p), () => {});
};

router.post('/', protect, adminOnly, upload.array('images', 5), asyncHandler(async (req, res) => {
  const data = fromBody(req.body);
  let gallery = filesToPaths(req.files);
  if (!gallery.length && req.body.imageUrl) gallery = [req.body.imageUrl];
  if (!gallery.length) fail(res, 400, 'At least one product image is required');
  if (data.discount === undefined && data.oldPrice > data.price) data.discount = Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100);
  const product = await Product.create({ ...data, image: gallery[0], gallery });
  res.status(201).json(product);
}));

router.put('/:id', protect, adminOnly, upload.array('images', 5), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) fail(res, 404, 'Product not found');
  Object.assign(product, fromBody(req.body));
  const added = filesToPaths(req.files);
  if (added.length) {
    if (req.body.appendImages === 'true') product.gallery = [...product.gallery, ...added];
    else { product.gallery.forEach(removeFile); product.gallery = added; }
    product.image = product.gallery[0];
  }
  await product.save();
  res.json(product);
}));

router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) fail(res, 404, 'Product not found');
  product.gallery.forEach(removeFile);
  await Review.deleteMany({ product: product._id });
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
}));

module.exports = router;
