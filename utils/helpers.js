const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');

exports.escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
exports.round2 = (n) => Math.round(n * 100) / 100;
exports.fail = (res, status, message) => { res.status(status); throw new Error(message); };

// accepts array, JSON string or "a,b,c"
exports.toArray = (v) => {
  if (v === undefined || v === null || v === '') return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch (e) { /* not json */ }
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
};

exports.recalcRating = async (productId) => {
  const [agg] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    reviews: agg ? agg.count : 0,
  });
};

exports.applyCoupon = async (code, subtotal) => {
  const Coupon = require('../models/Coupon');
  const bad = (m) => { const e = new Error(m); e.status = 400; return e; };
  const coupon = await Coupon.findOne({ code: String(code || '').trim().toUpperCase(), active: true });
  if (!coupon) throw bad('Invalid promo code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw bad('Promo code has expired');
  if (coupon.usageLimit && coupon.used >= coupon.usageLimit) throw bad('Promo code usage limit reached');
  if (subtotal < coupon.minOrder) throw bad(`Minimum order for this code is $${coupon.minOrder}`);
  let discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  discount = Math.min(exports.round2(discount), subtotal);
  return { coupon, discount };
};
