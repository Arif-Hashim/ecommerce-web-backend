// Usage: npm run seed   (WARNING: wipes products, reviews, coupons, carts, orders, users, images and testimonials)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Review = require('./models/Review');
const Coupon = require('./models/Coupon');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Testimonial = require('./models/Testimonial');
const Image = require('./models/Image');
const { ALL_SIZES } = require('./config/constants');
const { recalcRating } = require('./utils/helpers');

const DIR = path.join(__dirname, 'uploads', 'products');
// If you copy your real photos into uploads/products named like the keys below, they are used automatically.
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif' };
const cache = {};
// reads a photo from uploads/products and stores it in MongoDB; returns its "/api/images/<id>" path
const localImage = async (key) => {
  if (!key) return null;
  if (key in cache) return cache[key];
  cache[key] = null;
  if (fs.existsSync(DIR)) {
    const f = fs.readdirSync(DIR).find((n) => path.parse(n).name === key && TYPES[path.extname(n).toLowerCase()]);
    if (f) {
      const img = await Image.create({ name: f, contentType: TYPES[path.extname(f).toLowerCase()], data: fs.readFileSync(path.join(DIR, f)) });
      cache[key] = `/api/images/${img._id}`;
    }
  }
  return cache[key];
};
const bgs = ['e5e5e5', 'f2f0f1', 'ececec', 'e9e5df', 'f0efee', 'e6e0da', 'ede9e6'];
const ph = (i, text) => `/api/placeholder?bg=${bgs[i % bgs.length]}&text=${encodeURIComponent(text)}`; // served by our own backend

const S4 = ['Small', 'Medium', 'Large', 'X-Large'];
const S3 = ['Small', 'Medium', 'Large'];
const S3b = ['Medium', 'Large', 'X-Large'];
// [name, category, style, price, oldPrice, discount, colors, sizes, section, description, imageKey, extraKey]
const RAW = [
  ['Gradient Graphic T-shirt', 'T-shirts', 'Casual', 145, null, 0, ['Green', 'White', 'Black'], S4, 'new', 'A relaxed-fit tee with a bold gradient print across the chest. Soft, breathable cotton jersey that moves with you all day.', 'black-graphic-tee'],
  ['Polo with Tipping Details', 'Shirts', 'Casual', 180, null, 0, ['Black', 'White', 'Blue'], S3, 'new', 'A classic polo with contrast tipping on the collar and sleeves for a sharp, sporty finish.', 'maroon-polo'],
  ['Black Striped T-shirt', 'T-shirts', 'Casual', 120, 150, 20, ['Black', 'White'], S4, 'new', 'Timeless black and white stripes on a heavyweight cotton tee that only gets better with wear.', 'striped-raglan-tee'],
  ['Skinny Fit Jeans', 'Jeans', 'Casual', 240, 260, 20, ['Blue', 'Black'], S4, 'new', 'Stretch denim cut close to the leg for a modern silhouette that still moves easily.', 'black-skinny-jeans'],
  ['Checkered Shirt', 'Shirts', 'Casual', 180, null, 0, ['Red', 'Green', 'Black'], S3b, 'top', 'A brushed-cotton checkered shirt built for layering, with a relaxed everyday fit.', 'plaid-shirt'],
  ['Sleeve Striped T-shirt', 'T-shirts', 'Casual', 130, 160, 20, ['Orange', 'White'], S3, 'top', 'A crew-neck tee with striped sleeve detailing for a sporty, retro edge.', 'orange-raglan-tee'],
  ['Vertical Striped Shirt', 'Shirts', 'Formal', 212, 232, 20, ['Green', 'White'], S4, 'top', 'Crisp vertical stripes on lightweight poplin, smart enough for the office and easy enough for the weekend.', 'striped-raglan-tee-alt'],
  ['Courage Graphic T-shirt', 'T-shirts', 'Casual', 145, null, 0, ['Orange', 'Black'], S3, 'top', 'Statement graphic tee printed on soft-hand cotton for everyday wear.', 'black-graphic-tee'],
  ['Loose Fit Bermuda Shorts', 'Shorts', 'Casual', 80, null, 0, ['Blue', 'Black'], S3, 'style', 'Roomy bermuda shorts in durable cotton twill, finished with a drawstring waist.'],
  ['One Life Graphic T-shirt', 'T-shirts', 'Casual', 260, 300, 40, ['Green', 'Black', 'White'], S4, 'style', 'This graphic t-shirt is perfect for any occasion. Crafted from a soft and breathable fabric, it offers superior comfort and style all day.', 'one-life-tee', 'one-life-tee-model'],
  ['Faded Skinny Jeans', 'Jeans', 'Casual', 210, null, 0, ['Blue'], S3, 'style', 'Faded-wash skinny jeans with a touch of stretch for all-day comfort.', 'black-skinny-jeans'],
  ['Classic Pullover Hoodie', 'Hoodie', 'Gym', 195, 230, 15, ['Black', 'Cyan', 'Purple'], S4, 'style', 'Heavyweight fleece pullover hoodie with a kangaroo pocket, built for training days.'],
  // ---- extra products ----
  ['Oversized Cotton Tee', 'T-shirts', 'Casual', 95, null, 0, ['White', 'Black', 'Pink'], S4, 'none', 'Drop-shoulder oversized tee in thick, soft cotton.'],
  ['Gym Performance Tee', 'T-shirts', 'Gym', 110, 130, 15, ['Black', 'Blue', 'Red'], S4, 'none', 'Moisture-wicking stretch fabric that keeps you dry through every set.'],
  ['Sequin Party Tee', 'T-shirts', 'Party', 150, null, 0, ['Black', 'Pink'], S3, 'none', 'A shimmering sequin front panel makes this tee a night-out favourite.'],
  ['Classic White Tee', 'T-shirts', 'Casual', 70, null, 0, ['White'], ALL_SIZES, 'none', 'The everyday essential in pure combed cotton with a clean crew neck.'],
  ['V-Neck Basic Tee', 'T-shirts', 'Casual', 85, null, 0, ['Black', 'White', 'Blue'], S4, 'none', 'Lightweight v-neck tee that layers well under shirts and jackets.'],
  ['Tie-Dye Festival Tee', 'T-shirts', 'Party', 125, 145, 15, ['Purple', 'Pink', 'Cyan'], S3, 'none', 'Hand-dyed look with a loose fit, made for festivals and weekends.'],
  ['Sleeveless Gym Tee', 'T-shirts', 'Gym', 65, null, 0, ['Black', 'Red', 'Orange'], S4, 'none', 'Cut-off sleeveless tee with deep armholes for full range of motion.'],
  ['Slim Fit Formal Shirt', 'Shirts', 'Formal', 220, null, 0, ['White', 'Blue'], S4, 'none', 'Wrinkle-resistant slim shirt with a crisp collar for the office.'],
  ['Linen Summer Shirt', 'Shirts', 'Casual', 165, 185, 10, ['White', 'Cyan', 'Yellow'], S4, 'none', 'Breathable linen blend shirt that stays cool in the heat.'],
  ['Oxford Button-Down Shirt', 'Shirts', 'Formal', 200, null, 0, ['Blue', 'White', 'Pink'], S3b, 'none', 'A timeless oxford weave with a button-down collar.'],
  ['Brushed Flannel Shirt', 'Shirts', 'Casual', 175, 205, 15, ['Red', 'Green', 'Blue'], S4, 'none', 'Warm brushed flannel in a classic plaid, perfect for cooler days.'],
  ['Satin Party Shirt', 'Shirts', 'Party', 230, null, 0, ['Black', 'Purple', 'Red'], S3, 'none', 'A glossy satin shirt with a relaxed drape for evening events.'],
  ['Washed Denim Shirt', 'Shirts', 'Casual', 190, null, 0, ['Blue', 'Black'], S4, 'none', 'Soft washed denim shirt that works open over a tee or buttoned up.'],
  ['Straight Fit Jeans', 'Jeans', 'Casual', 230, null, 0, ['Blue', 'Black'], S4, 'none', 'Classic straight leg in mid-weight denim with a comfortable rise.'],
  ['Ripped Boyfriend Jeans', 'Jeans', 'Party', 250, 290, 15, ['Blue'], S3, 'none', 'Distressed boyfriend-fit jeans with a relaxed, slouchy shape.'],
  ['Relaxed Fit Jeans', 'Jeans', 'Casual', 220, null, 0, ['Blue', 'Black'], S4, 'none', 'Roomy through the thigh with a gently tapered leg.'],
  ['Black Slim Formal Jeans', 'Jeans', 'Formal', 245, null, 0, ['Black'], S3, 'none', 'Dark, clean-finish slim jeans that dress up easily.'],
  ['Cargo Shorts', 'Shorts', 'Casual', 90, null, 0, ['Green', 'Black', 'Orange'], S4, 'none', 'Utility cargo shorts with roomy side pockets.'],
  ['Gym Training Shorts', 'Shorts', 'Gym', 75, 90, 15, ['Black', 'Blue', 'Red'], S4, 'none', 'Lightweight training shorts with an inner liner and zip pocket.'],
  ['Chino Shorts', 'Shorts', 'Formal', 100, null, 0, ['Blue', 'Yellow', 'White'], S4, 'none', 'Tailored cotton chino shorts for smart-casual days.'],
  ['Printed Beach Shorts', 'Shorts', 'Party', 85, null, 0, ['Cyan', 'Pink', 'Yellow'], S3, 'none', 'Quick-dry beach shorts with a bold tropical print.'],
  ['Frayed Denim Shorts', 'Shorts', 'Casual', 95, null, 0, ['Blue', 'Black'], S3, 'none', 'Classic denim shorts with a frayed hem.'],
  ['Zip-Up Hoodie', 'Hoodie', 'Casual', 210, null, 0, ['Black', 'Blue', 'Green'], S4, 'none', 'Full-zip fleece hoodie with ribbed cuffs and a soft brushed lining.'],
  ['Oversized Streetwear Hoodie', 'Hoodie', 'Casual', 220, 250, 10, ['White', 'Black', 'Purple'], S4, 'none', 'Boxy oversized hoodie in heavyweight cotton fleece.'],
  ['Tech Fleece Gym Hoodie', 'Hoodie', 'Gym', 205, null, 0, ['Black', 'Red'], S4, 'none', 'Warm yet breathable fleece with a slim athletic fit.'],
  ['Graphic Print Hoodie', 'Hoodie', 'Party', 235, 260, 10, ['Black', 'Orange', 'Pink'], S3, 'none', 'Bold back print and a soft inner fleece for standout style.'],
  ['Half-Zip Fleece Pullover', 'Hoodie', 'Casual', 190, null, 0, ['Blue', 'Green', 'Black'], S4, 'none', 'Cosy half-zip pullover with a stand-up collar.'],
  ['Cropped Hoodie', 'Hoodie', 'Party', 170, null, 0, ['Pink', 'White', 'Black'], S3, 'none', 'Cropped cut with a drawstring hem for a modern look.'],
];

const REVIEWS = [
  ['Samantha D.', 5, 'August 14, 2023', 'I ordered this and it fits great. The material feels premium and the color is exactly as pictured. Would order again.'],
  ['Alex M.', 5, 'August 15, 2023', 'The quality is amazing for the price. Sizing runs true and delivery was quick. Highly recommend this shop.'],
  ['Ethan R.', 4, 'August 16, 2023', 'Good product overall, comfortable and looks nice. Took off one star only because shipping took a bit longer than expected.'],
  ['Olivia P.', 5, 'August 17, 2023', 'Absolutely love it! The fit is exactly what I wanted and it washes well without losing shape.'],
  ['Liam K.', 5, 'August 19, 2023', 'This is now my go-to. Comfortable, stylish, and holds up after multiple washes.'],
  ['Ava H.', 4, 'August 20, 2023', 'Great value for money. The stitching is solid and it looks even better in person.'],
];

const TESTIMONIALS = [
  ['Sarah M.', "I'm blown away by the quality and style of the clothes I received. Every piece feels well made and fits perfectly."],
  ['Alex K.', 'Finding clothes that match my personal style used to be a challenge until I found this store. The variety is amazing.'],
  ['James L.', 'As a fashion enthusiast, I appreciate the attention to detail and the quality of every single piece I have bought here.'],
  ['Priya S.', 'The customer service was fantastic and my order arrived earlier than expected. Will absolutely be shopping again.'],
];

(async () => {
  await connectDB();
  await Promise.all([User, Product, Review, Coupon, Cart, Order, Testimonial, Image].map((M) => M.deleteMany({})));

  await User.create([
    { name: 'Admin', email: process.env.ADMIN_EMAIL || 'admin@shopco.com', password: process.env.ADMIN_PASSWORD || 'Admin@123', role: 'admin' },
    { name: 'Test User', email: 'user@shopco.com', password: 'User@123' },
  ]);

  let usedLocal = 0;
  const docs = [];
  for (let i = 0; i < RAW.length; i += 1) {
    const [name, category, style, price, oldPrice, discount, colors, sizes, section, description, key, key2] = RAW[i];
    const main = await localImage(key);
    const second = await localImage(key2);
    if (main) usedLocal += 1;
    const gallery = main ? [main, ...(second ? [second] : [])] : [ph(i, name), ph(i + 1, name), ph(i + 2, name), ph(i + 3, name)];
    docs.push({ name, category, style, price, oldPrice, discount, colors, sizes, section, description, image: gallery[0], gallery, stock: 50 + ((i * 7) % 50) });
  }
  const products = await Product.insertMany(docs);

  const reviewDocs = [];
  products.forEach((p, i) => {
    for (let k = 0; k < 4; k += 1) {
      const [name, rating, date, text] = REVIEWS[(i + k) % REVIEWS.length];
      reviewDocs.push({ product: p._id, name, rating, text, verified: true, createdAt: new Date(date) });
    }
  });
  await Review.insertMany(reviewDocs);
  for (const p of products) await recalcRating(p._id);

  await Coupon.insertMany([
    { code: 'SAVE20', type: 'percent', value: 20 },
    { code: 'WELCOME10', type: 'percent', value: 10 },
    { code: 'FLAT50', type: 'fixed', value: 50, minOrder: 300 },
  ]);
  await Testimonial.insertMany(TESTIMONIALS.map(([name, text]) => ({ name, text, rating: 5 })));

  console.log(`Seeded ${products.length} products (${usedLocal} using local photos), ${reviewDocs.length} reviews, 3 coupons, 2 users.`);
  console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@shopco.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}   User: user@shopco.com / User@123`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
