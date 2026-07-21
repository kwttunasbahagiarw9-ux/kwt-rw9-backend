import express from 'express';
import { query } from 'express-validator';
import {
  listUsers, memberAttendanceReport, overview, plantSummary
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/overview', overview);

router.get(
  '/plant-summary',
  [query('from').optional({ checkFalsy: true }).isString(), query('to').optional({ checkFalsy: true }).isString()],
  validateRequest,
  plantSummary
);

router.get('/users', listUsers);

router.get(
  '/members/attendance',
  [query('date').notEmpty().withMessage('Tanggal wajib diisi.')],
  validateRequest,
  memberAttendanceReport
);

export default router;
