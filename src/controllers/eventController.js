import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';
import asyncHandler from '../utils/asyncHandler.js';
import { normalizeDateKey, todayDateKey, toDateOnly } from '../utils/date.js';

const parseEventBody = (body) => {
  const dateKey = normalizeDateKey(body.date);
  return {
    title: body.title,
    date: toDateOnly(dateKey),
    dateKey,
    startTime: body.startTime,
    endTime: body.endTime || undefined,
    location: body.location,
    description: body.description
  };
};

export const listEvents = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};

  if (status === 'upcoming') filter.dateKey = { $gte: todayDateKey() };
  if (status === 'past') filter.dateKey = { $lt: todayDateKey() };
  if (from || to) {
    filter.dateKey = {};
    if (from) filter.dateKey.$gte = normalizeDateKey(from);
    if (to) filter.dateKey.$lte = normalizeDateKey(to);
  }

  const events = await Event.find(filter)
    .sort({ dateKey: status === 'past' ? -1 : 1, startTime: 1 })
    .populate('createdBy', 'fullName username email');

  res.json({ events });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({
    ...parseEventBody(req.body),
    createdBy: req.user._id
  });

  res.status(201).json({ event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    const error = new Error('Kegiatan tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  Object.assign(event, parseEventBody(req.body));
  await event.save();

  res.json({ event });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    const error = new Error('Kegiatan tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  const hasAttendance = await Attendance.exists({ event: event._id });
  if (hasAttendance) {
    const error = new Error('Kegiatan sudah memiliki data absen dan tidak dapat dihapus.');
    error.statusCode = 409;
    throw error;
  }

  await event.deleteOne();
  res.json({ message: 'Kegiatan berhasil dihapus.' });
});
