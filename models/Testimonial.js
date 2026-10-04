const mongoose = require('mongoose');
const s = new mongoose.Schema({ name: String, rating: { type: Number, default: 5 }, text: String });
s.set('toJSON', { virtuals: true, transform: (d, r) => { delete r._id; delete r.__v; return r; } });
module.exports = mongoose.model('Testimonial', s);
