import Attendance from '../models/Attendance.js';
import Event from '../models/Event.js';
import PlantLog from '../models/PlantLog.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sevenDaysAgoKey, todayDateKey } from '../utils/date.js';

const conditionLabels = ['Healthy', 'Wilting', 'Pest-affected', 'Dead'];

const normalizeConditionCounts = (rows) => {
  const counts = Object.fromEntries(conditionLabels.map((label) => [label, 0]));
  rows.forEach((row) => {
    counts[row._id] = row.count;
  });
  return counts;
};

export const overview = asyncHandler(async (_req, res) => {
  const today = todayDateKey();
  const weekStart = sevenDaysAgoKey();

  const [
    totalMembers,
    todayAttendanceCount,
    upcomingActivities,
    plantConditionRows,
    recentAttendance,
    attendanceByEvent
  ] = await Promise.all([
    User.countDocuments({ role: 'user', isActive: true }),
    Attendance.countDocuments({ dateKey: today }),
    Event.countDocuments({ dateKey: { $gte: today } }),
    PlantLog.aggregate([
      { $match: { dateKey: { $gte: weekStart } } },
      { $group: { _id: '$condition', count: { $sum: 1 } } }
    ]),
    Attendance.find()
      .sort({ checkedInAt: -1 })
      .limit(8)
      .populate('user', 'fullName username email plotLabel')
      .populate('event', 'title dateKey location'),
    Attendance.aggregate([
      { $match: { event: { $ne: null } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      { $project: { count: 1, title: '$event.title', dateKey: '$event.dateKey' } }
    ])
  ]);

  const plantHealthSummary = normalizeConditionCounts(plantConditionRows);
  const atRiskCount =
    plantHealthSummary.Wilting + plantHealthSummary['Pest-affected'] + plantHealthSummary.Dead;

  res.json({
    totalMembers,
    todayAttendanceCount,
    upcomingActivities,
    plantHealthSummary,
    atRiskCount,
    recentAttendance,
    attendanceByEvent
  });
});

export const plantSummary = asyncHandler(async (req, res) => {
  const from = req.query.from || sevenDaysAgoKey();
  const to = req.query.to || todayDateKey();
  const rows = await PlantLog.aggregate([
    { $match: { dateKey: { $gte: from, $lte: to } } },
    { $group: { _id: { condition: '$condition', growthStage: '$growthStage' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({ rows });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({ isActive: true })
    .select('-passwordHash')
    .sort({ role: 1, fullName: 1 });

  res.json({ users });
});

export const memberAttendanceReport = asyncHandler(async (req, res) => {
  const date = req.query.date;

  if (!date) {
    const error = new Error('Parameter tanggal wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  const [users, attendanceRecords] = await Promise.all([
    User.find({ role: 'user', isActive: true }).select('fullName email plotLabel avatarUrl').sort({ fullName: 1 }),
    Attendance.find({ dateKey: date }).select('user photoUrl checkedInAt').lean()
  ]);

  const attendedUserIds = new Set(attendanceRecords.map((r) => r.user.toString()));
  const attendanceMap = Object.fromEntries(
    attendanceRecords.map((r) => [r.user.toString(), r])
  );

  const members = users.map((user) => {
    const id = user._id.toString();
    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      plotLabel: user.plotLabel,
      avatarUrl: user.avatarUrl,
      attended: attendedUserIds.has(id),
      photoUrl: attendanceMap[id]?.photoUrl || null,
      checkedInAt: attendanceMap[id]?.checkedInAt || null
    };
  });

  const attended = members.filter((m) => m.attended);
  const notAttended = members.filter((m) => !m.attended);

  res.json({
    date,
    total: members.length,
    attended: attended.length,
    notAttended: notAttended.length,
    members
  });
});
