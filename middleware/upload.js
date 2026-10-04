const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const base = path.parse(file.originalname).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    cb(null, `${Date.now()}-${base}${path.extname(file.originalname).toLowerCase()}`);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|avif|gif)$/.test(file.mimetype)) return cb(null, true);
    const e = new Error('Only image files are allowed'); e.status = 400; cb(e);
  },
});
