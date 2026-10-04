const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: [true, 'Review text is required'], trim: true },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

// one review per user per product (seeded reviews have no user)
reviewSchema.index({ product: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
reviewSchema.set('toJSON', { virtuals: true, transform: (d, r) => { delete r._id; delete r.__v; return r; } });
module.exports = mongoose.model('Review', reviewSchema);
