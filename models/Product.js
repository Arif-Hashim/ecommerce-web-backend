const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  category: { type: String, required: true, index: true },
  style: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: null },
  discount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  colors: [String],
  sizes: [String],
  description: { type: String, default: '' },
  section: { type: String, enum: ['new', 'top', 'style', 'none'], default: 'none' },
  image: { type: String, required: true },
  gallery: [String],
  stock: { type: Number, default: 100, min: 0 },
}, { timestamps: true });

productSchema.set('toJSON', { virtuals: true, transform: (d, r) => { delete r._id; delete r.__v; return r; } });
module.exports = mongoose.model('Product', productSchema);
