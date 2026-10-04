const router = require('express').Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { fail, round2 } = require('../utils/helpers');

router.use(protect);

const format = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  const items = (cart ? cart.items : []).filter((i) => i.product).map((i) => ({
    id: i._id,
    productId: i.product.id,
    name: i.product.name,
    image: i.product.image,
    price: i.product.price,
    oldPrice: i.product.oldPrice,
    color: i.color,
    size: i.size,
    quantity: i.quantity,
    stock: i.product.stock,
  }));
  return {
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: round2(items.reduce((s, i) => s + i.price * i.quantity, 0)),
  };
};

const addItem = async (res, userId, { productId, color, size, quantity = 1 }) => {
  const product = await Product.findById(productId);
  if (!product) fail(res, 404, 'Product not found');
  if (color && product.colors.length && !product.colors.includes(color)) fail(res, 400, 'Invalid color');
  if (size && product.sizes.length && !product.sizes.includes(size)) fail(res, 400, 'Invalid size');
  const qty = Math.max(1, parseInt(quantity) || 1);
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = new Cart({ user: userId, items: [] });
  const existing = cart.items.find((i) => String(i.product) === String(product._id) && i.color === color && i.size === size);
  const newQty = (existing ? existing.quantity : 0) + qty;
  if (newQty > product.stock) fail(res, 400, `Only ${product.stock} in stock`);
  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: product._id, color, size, quantity: qty });
  await cart.save();
};

router.get('/', asyncHandler(async (req, res) => res.json(await format(req.user._id))));

router.post('/', asyncHandler(async (req, res) => {
  await addItem(res, req.user._id, req.body);
  res.status(201).json(await format(req.user._id));
}));

// merge guest (localStorage) cart after login: { items: [{productId,color,size,quantity}] }
router.post('/merge', asyncHandler(async (req, res) => {
  for (const it of req.body.items || []) {
    try { await addItem(res, req.user._id, it); } catch (e) { res.status(200); /* skip bad items */ }
  }
  res.json(await format(req.user._id));
}));

router.put('/:itemId', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart && cart.items.id(req.params.itemId);
  if (!item) fail(res, 404, 'Cart item not found');
  const qty = parseInt(req.body.quantity);
  if (!qty || qty < 1) item.deleteOne();
  else {
    const product = await Product.findById(item.product);
    if (product && qty > product.stock) fail(res, 400, `Only ${product.stock} in stock`);
    item.quantity = qty;
  }
  await cart.save();
  res.json(await format(req.user._id));
}));

router.delete('/:itemId', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart && cart.items.id(req.params.itemId);
  if (!item) fail(res, 404, 'Cart item not found');
  item.deleteOne();
  await cart.save();
  res.json(await format(req.user._id));
}));

router.delete('/', asyncHandler(async (req, res) => {
  await Cart.deleteOne({ user: req.user._id });
  res.json(await format(req.user._id));
}));

module.exports = router;
