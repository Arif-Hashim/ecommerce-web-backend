const router = require('express').Router();
const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../utils/asyncHandler');
const { CATEGORIES, DRESS_STYLES, ALL_SIZES, COLORS } = require('../config/constants');

router.get('/', (req, res) => res.json({ categories: CATEGORIES, styles: DRESS_STYLES, sizes: ALL_SIZES, colors: COLORS, deliveryFee: Number(process.env.DELIVERY_FEE ?? 15) }));
router.get('/testimonials', asyncHandler(async (req, res) => res.json(await Testimonial.find())));

module.exports = router;
