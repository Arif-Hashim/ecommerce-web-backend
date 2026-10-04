const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const getUser = async (req) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.id);
};

exports.protect = asyncHandler(async (req, res, next) => {
  let user = null;
  try { user = await getUser(req); } catch (e) { user = null; }
  if (!user) { res.status(401); throw new Error('Not authorized, please log in'); }
  req.user = user;
  next();
});

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403);
  throw new Error('Admin access only');
};
