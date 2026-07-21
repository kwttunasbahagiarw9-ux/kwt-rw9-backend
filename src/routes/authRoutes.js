import express from 'express';
import { body } from 'express-validator';
import { forgotPassword, login, me, register, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Masukkan alamat Gmail yang valid.')
      .custom((value) => value.toLowerCase().endsWith('@gmail.com'))
      .withMessage('Gunakan alamat Gmail yang valid.'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
    body('fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Nama lengkap wajib diisi.')
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').trim().notEmpty().withMessage('Gmail wajib diisi.'),
    body('password').notEmpty().withMessage('Password wajib diisi.')
  ],
  validateRequest,
  login
);

router.get('/me', protect, me);

router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Masukkan alamat Gmail yang valid.')],
  validateRequest,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token wajib diisi.'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.')
  ],
  validateRequest,
  resetPassword
);

export default router;
