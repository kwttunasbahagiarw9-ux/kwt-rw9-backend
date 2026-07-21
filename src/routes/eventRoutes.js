import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent
} from '../controllers/eventController.js';
import { protect, requireRole } from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();
const timeMessage = 'Format jam harus HH:mm.';

const eventRules = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Judul kegiatan wajib diisi.'),
  body('date').notEmpty().withMessage('Tanggal kegiatan wajib diisi.'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage(timeMessage),
  body('endTime').optional({ checkFalsy: true }).matches(/^\d{2}:\d{2}$/).withMessage(timeMessage),
  body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Lokasi wajib diisi.'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 })
];

router.get(
  '/',
  protect,
  [
    query('status').optional().isIn(['upcoming', 'past']).withMessage('Status kegiatan tidak valid.'),
    query('from').optional().isString(),
    query('to').optional().isString()
  ],
  validateRequest,
  listEvents
);

router.post('/', protect, requireRole('admin'), eventRules, validateRequest, createEvent);

router.put(
  '/:id',
  protect,
  requireRole('admin'),
  [param('id').isMongoId().withMessage('ID kegiatan tidak valid.'), ...eventRules],
  validateRequest,
  updateEvent
);

router.delete(
  '/:id',
  protect,
  requireRole('admin'),
  [param('id').isMongoId().withMessage('ID kegiatan tidak valid.')],
  validateRequest,
  deleteEvent
);

export default router;
