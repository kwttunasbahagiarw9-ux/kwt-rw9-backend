import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Silakan login terlebih dahulu.');
    error.statusCode = 401;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in the backend environment.');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-passwordHash');

  if (!user || !user.isActive) {
    const error = new Error('Akun tidak ditemukan atau tidak aktif.');
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    const error = new Error('Akses tidak diizinkan.');
    error.statusCode = 403;
    return next(error);
  }

  next();
};
