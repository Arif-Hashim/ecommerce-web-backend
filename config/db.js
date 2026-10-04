const mongoose = require('mongoose');

// Works both for a normal server and for serverless (Vercel): the connection is reused between requests.
let connecting = null;
module.exports = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => console.log('MongoDB connected'));
  }
  try {
    await connecting;
  } catch (e) {
    connecting = null;
    console.error('MongoDB connection failed:', e.message);
    throw e;
  }
};
