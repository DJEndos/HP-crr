// Run with: npm run seed
// Creates a default admin account from the ADMIN_EMAIL/ADMIN_PASSWORD in .env
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  await User.create({
    fullName: 'System Administrator',
    email,
    password,
    role: 'admin',
    staffId: 'ADMIN-001'
  });

  console.log('Default admin created:', email);
  process.exit(0);
})();
