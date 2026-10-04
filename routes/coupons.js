const router = require('express').Router();
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const { protect, adminOnly } = require('../middleware/auth');
const { applyCoupon, fail } = require('../utils/helpers');

// public: POST /api/coupons/validate { code, subtotal }
router.post('/validate', asyncHandler(async (req, res) => {
  const subtotal = Number(req.body.subtotal) || 0;
  const { coupon, discount } = await applyCoupon(req.body.code, subtotal);
  res.json({ valid: true, code: coupon.code, type: coupon.type, value: coupon.value, discount });
}));

router.get('/', protect, adminOnly, asyncHandler(async (req, res) => res.json(await Coupon.find().sort({ createdAt: -1 }))));
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => res.status(201).json(await Coupon.create(req.body))));
router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) fail(res, 404, 'Coupon not found');
  res.json(c);
}));
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coupon deleted' });
}));

module.exports = router;
