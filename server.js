// Local development / normal hosting entry. (On Vercel, app.js is used directly.)
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch(() => process.exit(1));
