const mongoose = require('mongoose');

// Product photos are stored in MongoDB so they survive on hosts without a permanent disk (e.g. Vercel).
const imageSchema = new mongoose.Schema({
  name: String,
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);
