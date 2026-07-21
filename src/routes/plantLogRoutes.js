import express from 'express';
import { body, query } from 'express-validator';
import {
  createPlantLog,
  listPlantLogs,
  myPlantLogs
} from '../controllers/plantLogController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { singlePhoto } from '../middleware/upload.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

const conditions = ['Healthy', 'Wilting', 'Pest-affected', 'Dead'];
const growthStages = ['Seedling', 'Growing', 'Flowering', 'Harvest-ready'];

router.post(
  '/',
  protect,
  singlePhoto,
  [
    body('eventId').optional({ checkFalsy: true }).isMongoId().withMessage('ID kegiatan tidak valid.'),
    body('date').optional({ checkFalsy: true }).isString(),
    body('condition').isIn(conditions).withMessage('Kondisi tanaman wajib dipilih.'),
    body('growthStage').isIn(growthStages).withMessage('Tahap pertumbuhan wajib dipilih.'),
    body('note').optional({ checkFalsy: true }).trim().isLength({ max: 180 })
  ],
  validateRequest,
  createPlantLog
);

router.get('/me', protect, myPlantLogs);

router.get(
  '/',
  protect,
  requireRole('admin'),
  [
    query('condition').optional({ checkFalsy: true }).isIn(conditions),
    query('user').optional({ checkFalsy: true }).isMongoId().withMessage('ID anggota tidak valid.'),
    query('from').optional({ checkFalsy: true }).isString(),
    query('to').optional({ checkFalsy: true }).isString()
  ],
  validateRequest,
  listPlantLogs
);

export default router;
