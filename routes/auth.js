const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { fail } = require('../utils/helpers');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) fail(res, 400, 'Name, email and password are required');
  if (password.length < 6) fail(res, 400, 'Password must be at least 6 characters');
  if (await User.findOne({ email: email.toLowerCase() })) fail(res, 409, 'Email already registered');
  const user = await User.create({ name, email, password }); // role is always "user"
  res.status(201).json({ token: sign(user._id), user });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) fail(res, 400, 'Email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) fail(res, 401, 'Invalid email or password');
  res.json({ token: sign(user._id), user });
}));

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

router.put('/me', protect, asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (address) req.user.address = { ...(req.user.address || {}), ...address };
  await req.user.save();
  res.json({ user: req.user });
}));

router.put('/password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) fail(res, 400, 'Current and new password are required');
  if (newPassword.length < 6) fail(res, 400, 'New password must be at least 6 characters');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) fail(res, 400, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
}));

module.exports = router;
