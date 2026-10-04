const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  value: { type: Number, required: true, min: 0 },
  minOrder: { type: Number, default: 0 },
  expiresAt: Date,
  usageLimit: { type: Number, default: 0 }, // 0 = unlimited
  used: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.set('toJSON', { virtuals: true, transform: (d, r) => { delete r._id; delete r.__v; return r; } });
module.exports = mongoose.model('Coupon', couponSchema);
