const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String, image: String, price: Number, color: String, size: String, quantity: Number,
  }],
  shippingAddress: { fullName: String, phone: String, street: String, city: String, postalCode: String, country: String },
  paymentMethod: { type: String, enum: ['cod', 'card'], default: 'cod' },
  subtotal: Number,
  discount: { type: Number, default: 0 },
  couponCode: String,
  deliveryFee: Number,
  total: Number,
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  deliveredAt: Date,
}, { timestamps: true });

orderSchema.set('toJSON', { virtuals: true, transform: (d, r) => { delete r._id; delete r.__v; return r; } });
module.exports = mongoose.model('Order', orderSchema);
