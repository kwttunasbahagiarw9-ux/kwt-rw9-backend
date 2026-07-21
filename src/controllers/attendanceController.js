import Attendance from '../models/Attendance.js';
import asyncHandler from '../utils/asyncHandler.js';
import { normalizeDateKey, todayDateKey } from '../utils/date.js';
import { toCsv } from '../utils/csv.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';

const populateAttendance = (query) =>
  query.populate('user', 'fullName username email plotLabel').populate('event', 'title dateKey startTime location');

const getAttendanceFilters = (query) => {
  const filter = {};
  if (query.date) filter.dateKey = normalizeDateKey(query.date);
  if (query.user) filter.user = query.user;
  if (query.event) filter.event = query.event;
  return filter;
};

export const attendanceLocation = asyncHandler(async (_req, res) => {
  const lat = parseFloat(process.env.ATTENDANCE_LAT);
  const lng = parseFloat(process.env.ATTENDANCE_LNG);
  const radius = parseInt(process.env.ATTENDANCE_RADIUS, 10) || 100;

  if (!lat || !lng) {
    res.json({ enabled: false });
    return;
  }

  res.json({
    enabled: true,
    lat,
    lng,
    radius
  });
});

export const checkIn = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('Foto selfie wajib diunggah untuk absen.');
    error.statusCode = 400;
    throw error;
  }

  const dateKey = todayDateKey();
  const duplicate = await Attendance.findOne({
    user: req.user._id,
    event: null,
    dateKey
  });

  if (duplicate) {
    const error = new Error('Ibu sudah absen hari ini.');
    error.statusCode = 409;
    throw error;
  }

  const photo = await uploadBufferToCloudinary(req.file, 'kwt-rw9/attendance');
  const attendance = await Attendance.create({
    user: req.user._id,
    event: null,
    dateKey,
    photoUrl: photo.url,
    photoPublicId: photo.publicId,
    location: {
      type: 'Point',
      coordinates: [
        parseFloat(req.body.lng) || 0,
        parseFloat(req.body.lat) || 0
      ]
    }
  });

  const populated = await populateAttendance(Attendance.findById(attendance._id));
  res.status(201).json({ message: 'Absen berhasil!', attendance: populated });
});

export const myAttendance = asyncHandler(async (req, res) => {
  const attendance = await populateAttendance(
    Attendance.find({ user: req.user._id }).sort({ checkedInAt: -1 })
  );

  res.json({ attendance });
});

export const myTodayAttendance = asyncHandler(async (req, res) => {
  const dateKey = todayDateKey();
  const attendance = await populateAttendance(
    Attendance.find({ user: req.user._id, dateKey }).sort({ checkedInAt: -1 })
  );

  res.json({ attendance, dateKey });
});

export const listAttendance = asyncHandler(async (req, res) => {
  const attendance = await populateAttendance(
    Attendance.find(getAttendanceFilters(req.query)).sort({ checkedInAt: -1 })
  );

  res.json({ attendance });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    const error = new Error('Data absensi tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  const updates = {};
  if (req.body.dateKey) updates.dateKey = normalizeDateKey(req.body.dateKey);
  if (req.body.event !== undefined) updates.event = req.body.event || null;

  const updated = await populateAttendance(
    Attendance.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
  );

  res.json({ message: 'Data absensi berhasil diperbarui.', attendance: updated });
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    const error = new Error('Data absensi tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  await Attendance.findByIdAndDelete(id);
  res.json({ message: 'Data absensi berhasil dihapus.' });
});

export const exportAttendanceCsv = asyncHandler(async (req, res) => {
  const attendance = await populateAttendance(
    Attendance.find(getAttendanceFilters(req.query)).sort({ checkedInAt: -1 })
  );

  const csv = toCsv(attendance, [
    { label: 'Nama', value: (row) => row.user?.fullName },
    { label: 'Gmail', value: (row) => row.user?.email || row.user?.username },
    { label: 'Plot', value: (row) => row.user?.plotLabel },
    { label: 'Tanggal', value: (row) => row.dateKey },
    { label: 'Waktu Absen', value: (row) => row.checkedInAt.toISOString() },
    { label: 'Kegiatan', value: (row) => row.event?.title || 'Absen harian' },
    { label: 'Lokasi', value: (row) => row.event?.location || '' },
    { label: 'Foto', value: (row) => row.photoUrl }
  ]);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="absensi-${todayDateKey()}.csv"`);
  res.send(csv);
});
