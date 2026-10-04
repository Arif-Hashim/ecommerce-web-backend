const multer = require('multer');

// Files are kept in memory and then saved to MongoDB (see utils/images.js).
// Keep each file small: Vercel allows about 4.5 MB per request (the admin form resizes photos automatically).
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|avif|gif)$/.test(file.mimetype)) return cb(null, true);
    const e = new Error('Only image files are allowed'); e.status = 400; cb(e);
  },
});
