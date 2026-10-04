const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const asyncHandler = require('../utils/asyncHandler');
const { protect, adminOnly } = require('../middleware/auth');
const { ORDER_STATUSES } = require('../config/constants');
const { applyCoupon, fail, round2 } = require('../utils/helpers');

router.use(protect);

// POST /api/orders  { shippingAddress, paymentMethod, couponCode, items? }
// If "items" is omitted the user's saved server cart is used. Prices always come from the DB.
router.post('/', asyncHandler(async (req, res) => {
  const { shippingAddress: a = {}, paymentMethod = 'cod', couponCode } = req.body;
  ['fullName', 'phone', 'street', 'city'].forEach((f) => { if (!a[f]) fail(res, 400, `Shipping ${f} is required`); });

  let input = req.body.items;
  if (!Array.isArray(input) || !input.length) {
    const cart = await Cart.findOne({ user: req.user._id });
    input = (cart ? cart.items : []).map((i) => ({ productId: i.product, color: i.color, size: i.size, quantity: i.quantity }));
  }
  if (!input.length) fail(res, 400, 'Cart is empty');

  const items = [];
  let subtotal = 0;
  for (const it of input) {
    const product = await Product.findById(it.productId);
    if (!product) fail(res, 400, 'A product in your cart no longer exists');
    const quantity = Math.max(1, parseInt(it.quantity) || 1);
    if (product.stock < quantity) fail(res, 400, `Only ${product.stock} left of ${product.name}`);
    items.push({ product: product._id, name: product.name, image: product.image, price: product.price, color: it.color, size: it.size, quantity });
    subtotal += product.price * quantity;
  }
  subtotal = round2(subtotal);

  let discount = 0;
  let coupon = null;
  if (couponCode) ({ coupon, discount } = await applyCoupon(couponCode, subtotal));
  const deliveryFee = Number(process.env.DELIVERY_FEE ?? 15);
  const total = round2(subtotal - discount + deliveryFee);

  const order = await Order.create({
    user: req.user._id, items, shippingAddress: a, paymentMethod,
    subtotal, discount, couponCode: coupon ? coupon.code : undefined, deliveryFee, total,
  });
  await Promise.all(items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity } })));
  if (coupon) await coupon.updateOne({ $inc: { used: 1 } });
  await Cart.deleteOne({ user: req.user._id });
  res.status(201).json(order);
}));

router.get('/mine', asyncHandler(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
}));

// admin: all orders  ?status=&page=&limit=
router.get('/', adminOnly, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const filter = req.query.status ? { status: req.query.status } : {};
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) || 1 });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) fail(res, 404, 'Order not found');
  if (req.user.role !== 'admin' && String(order.user._id) !== String(req.user._id)) fail(res, 403, 'Not allowed');
  res.json(order);
}));

const restock = (order) => Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));

router.put('/:id/cancel', asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) fail(res, 404, 'Order not found');
  if (order.status !== 'pending') fail(res, 400, 'Only pending orders can be cancelled');
  order.status = 'cancelled';
  await order.save();
  await restock(order);
  res.json(order);
}));

router.put('/:id/status', adminOnly, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) fail(res, 400, `Status must be one of: ${ORDER_STATUSES.join(', ')}`);
  const order = await Order.findById(req.params.id);
  if (!order) fail(res, 404, 'Order not found');
  if (order.status === 'cancelled') fail(res, 400, 'Cancelled orders cannot be changed');
  if (status === 'cancelled') await restock(order);
  order.status = status;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod') { order.isPaid = true; order.paidAt = new Date(); }
  }
  await order.save();
  res.json(order);
}));

module.exports = router;
