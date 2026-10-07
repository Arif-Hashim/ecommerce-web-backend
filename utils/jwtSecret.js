const crypto = require('crypto');

// Uses JWT_SECRET if it is set. If it is missing, a private secret is derived from MONGO_URI
// (which already contains your database password), so login never breaks because of a missing variable.
module.exports = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET.trim();
  if (process.env.MONGO_URI) return crypto.createHash('sha256').update(`shopco-jwt:${process.env.MONGO_URI}`).digest('hex');
  throw new Error('Set JWT_SECRET in the environment variables');
};
