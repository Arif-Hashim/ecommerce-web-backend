const router = require('express').Router();
const Image = require('../models/Image');
const asyncHandler = require('../utils/asyncHandler');

router.get('/:id', asyncHandler(async (req, res) => {
  const img = await Image.findById(req.params.id);
  if (!img) { res.status(404); throw new Error('Image not found'); }
  res.set('Content-Type', img.contentType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(Buffer.from(img.data));
}));

module.exports = router;
