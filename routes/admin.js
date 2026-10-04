const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { protect, adminOnly } = require('../middleware/auth');
const { fail } = require('../utils/helpers');

router.use(protect, adminOnly);

router.get('/stats', asyncHandler(async (req, res) => {
  const [users, products, orders, revenueAgg, byStatus, recentOrders] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
  ]);
  res.json({
    users, products, orders,
    revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
    ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    recentOrders,
  });
}));

router.get('/users', asyncHandler(async (req, res) => res.json(await User.find().sort({ createdAt: -1 }))));

router.put('/users/:id/role', asyncHandler(async (req, res) => {
  if (!['user', 'admin'].includes(req.body.role)) fail(res, 400, 'Role must be user or admin');
  if (String(req.params.id) === String(req.user._id)) fail(res, 400, 'You cannot change your own role');
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) fail(res, 404, 'User not found');
  res.json(user);
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) fail(res, 400, 'You cannot delete yourself');
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
}));

module.exports = router;
