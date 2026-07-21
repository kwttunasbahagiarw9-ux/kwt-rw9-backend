import express from 'express';
import { query } from 'express-validator';
import {
  attendanceLocation,
  checkIn,
  deleteAttendance,
  exportAttendanceCsv,
  listAttendance,
  myAttendance,
  myTodayAttendance,
  updateAttendance
} from '../controllers/attendanceController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { singlePhoto } from '../middleware/upload.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

router.get('/location', attendanceLocation);

router.post('/', protect, singlePhoto, checkIn);

router.get('/me/today', protect, myTodayAttendance);
router.get('/me', protect, myAttendance);

router.get(
  '/',
  protect,
  requireRole('admin'),
  [
    query('date').optional({ checkFalsy: true }).isString(),
    query('user').optional({ checkFalsy: true }).isMongoId().withMessage('ID anggota tidak valid.'),
    query('event').optional({ checkFalsy: true }).isMongoId().withMessage('ID kegiatan tidak valid.')
  ],
  validateRequest,
  listAttendance
);

router.put('/:id', protect, requireRole('admin'), updateAttendance);
router.delete('/:id', protect, requireRole('admin'), deleteAttendance);

router.get(
  '/export',
  protect,
  requireRole('admin'),
  [
    query('date').optional({ checkFalsy: true }).isString(),
    query('user').optional({ checkFalsy: true }).isMongoId().withMessage('ID anggota tidak valid.'),
    query('event').optional({ checkFalsy: true }).isMongoId().withMessage('ID kegiatan tidak valid.')
  ],
  validateRequest,
  exportAttendanceCsv
);

export default router;
