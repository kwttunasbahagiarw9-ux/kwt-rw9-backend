import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../middleware/auth.js';
import { createUsernameFromEmail, normalizeEmail } from '../utils/userIdentity.js';
import { sendResetEmail } from '../utils/email.js';

const publicUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone,
  plotLabel: user.plotLabel,
  role: user.role,
  isActive: user.isActive,
  avatarUrl: user.avatarUrl,
  avatarPublicId: user.avatarPublicId
});

const authResponse = (res, user, statusCode = 200) => {
  res.status(statusCode).json({
    token: signToken(user),
    user: publicUser(user)
  });
};

export const register = asyncHandler(async (req, res) => {
  const { password, fullName } = req.body;
  const email = normalizeEmail(req.body.email);
  const existing = await User.findOne({ email });

  if (existing) {
    const error = new Error('Gmail sudah terdaftar.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const username = await createUsernameFromEmail(email);
  const user = await User.create({
    username,
    email,
    passwordHash,
    fullName,
    role: 'user'
  });

  authResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const identifier = normalizeEmail(req.body.email || req.body.username);
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  if (!user || !user.isActive) {
    const error = new Error('Gmail atau password salah.');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    const error = new Error('Gmail atau password salah.');
    error.statusCode = 401;
    throw error;
  }

  authResponse(res, user);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    const error = new Error('Masukkan alamat Gmail Anda.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.json({ message: 'Jika Gmail terdaftar, tautan atur ulang akan dikirim.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  user.resetPasswordToken = hash;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password/${token}`;

  try {
    await sendResetEmail(user.email, user.fullName, resetLink);
  } catch (err) {
    console.error('Gagal kirim email:', err.message);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    const error = new Error('Gagal mengirim email. Coba lagi nanti.');
    error.statusCode = 500;
    throw error;
  }

  res.json({ message: 'Jika Gmail terdaftar, tautan atur ulang akan dikirim.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    const error = new Error('Token dan password baru wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error('Password minimal 6 karakter.');
    error.statusCode = 400;
    throw error;
  }

  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hash,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    const error = new Error('Token tidak valid atau sudah kedaluwarsa.');
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: 'Password berhasil diatur ulang. Silakan masuk.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
