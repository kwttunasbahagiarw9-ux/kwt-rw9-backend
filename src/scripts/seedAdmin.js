import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import { createUsernameFromEmail, normalizeEmail } from '../utils/userIdentity.js';

const readArg = (name) => {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length).trim() : '';
};

const wantsHelp = process.argv.includes('--help') || process.argv.includes('-h');
const email = normalizeEmail(readArg('email') || process.env.ADMIN_EMAIL);
const password = readArg('password') || process.env.ADMIN_PASSWORD;
const fullName = (readArg('name') || process.env.ADMIN_FULL_NAME || 'Admin KWT RW 9').trim();

const showUsage = () => {
  console.log(
    'Contoh: npm run seed:admin -- --email=admin@gmail.com --password=passwordku --name="Admin KWT RW 9"'
  );
  console.log('Atau isi ADMIN_EMAIL, ADMIN_PASSWORD, dan ADMIN_FULL_NAME di backend/.env.');
};

if (wantsHelp) {
  showUsage();
  process.exit(0);
}

const showUsageAndExit = () => {
  console.error('Email dan password admin wajib diisi.');
  showUsage();
  process.exit(1);
};

const seedAdmin = async () => {
  if (!email || !password) {
    showUsageAndExit();
  }

  await connectDB();

  const existing = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    existing.fullName = fullName || existing.fullName;
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.isActive = true;

    if (!existing.username) {
      existing.username = await createUsernameFromEmail(email, { excludeUserId: existing._id });
    }

    await existing.save();
    console.log(`Akun admin diperbarui untuk ${email}.`);
    return;
  }

  const username = await createUsernameFromEmail(email);
  await User.create({
    username,
    email,
    passwordHash,
    fullName,
    role: 'admin',
    isActive: true
  });

  console.log(`Akun admin dibuat untuk ${email}.`);
};

seedAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
