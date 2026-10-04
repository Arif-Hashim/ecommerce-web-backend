const router = require('express').Router();
const build = require('../utils/placeholderSvg');

// GET /api/placeholder?text=Product+name&bg=e5e5e5
router.get('/', (req, res) => {
  res.set('Content-Type', 'image/svg+xml');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(build(String(req.query.text || '').slice(0, 80), String(req.query.bg || '')));
});

module.exports = router;
