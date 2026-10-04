const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters'], select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  address: { street: String, city: String, postalCode: String, country: String },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matchPassword = function (plain) { return bcrypt.compare(plain, this.password); };
userSchema.set('toJSON', { virtuals: true, transform: (d, r) => { delete r._id; delete r.__v; delete r.password; return r; } });

module.exports = mongoose.model('User', userSchema);
