import PlantLog from '../models/PlantLog.js';
import Event from '../models/Event.js';
import asyncHandler from '../utils/asyncHandler.js';
import { normalizeDateKey, toDateOnly } from '../utils/date.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';

const populatePlantLog = (query) =>
  query.populate('user', 'fullName username email plotLabel').populate('event', 'title dateKey location');

const parseLogDate = async (body) => {
  if (!body.eventId) {
    const dateKey = normalizeDateKey(body.date);
    return { event: null, dateKey };
  }

  const event = await Event.findById(body.eventId);
  if (!event) {
    const error = new Error('Kegiatan tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  return {
    event: event._id,
    dateKey: body.date ? normalizeDateKey(body.date) : event.dateKey
  };
};

export const createPlantLog = asyncHandler(async (req, res) => {
  const { event, dateKey } = await parseLogDate(req.body);
  const photo = req.file ? await uploadBufferToCloudinary(req.file, 'kwt-rw9/plants') : null;

  const log = await PlantLog.create({
    user: req.user._id,
    event,
    date: toDateOnly(dateKey),
    dateKey,
    condition: req.body.condition,
    growthStage: req.body.growthStage,
    note: req.body.note,
    photoUrl: photo?.url,
    photoPublicId: photo?.publicId
  });

  const populated = await populatePlantLog(PlantLog.findById(log._id));
  res.status(201).json({ message: 'Catatan tanaman berhasil disimpan.', log: populated });
});

export const myPlantLogs = asyncHandler(async (req, res) => {
  const logs = await populatePlantLog(
    PlantLog.find({ user: req.user._id }).sort({ dateKey: -1, createdAt: -1 })
  );

  res.json({ logs });
});

export const listPlantLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.condition) filter.condition = req.query.condition;
  if (req.query.user) filter.user = req.query.user;
  if (req.query.from || req.query.to) {
    filter.dateKey = {};
    if (req.query.from) filter.dateKey.$gte = normalizeDateKey(req.query.from);
    if (req.query.to) filter.dateKey.$lte = normalizeDateKey(req.query.to);
  }

  const logs = await populatePlantLog(
    PlantLog.find(filter).sort({ dateKey: -1, createdAt: -1 })
  );

  res.json({ logs });
});
