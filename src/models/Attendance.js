import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true
    },
    dateKey: {
      type: String,
      required: true,
      index: true
    },
    checkedInAt: {
      type: Date,
      default: Date.now
    },
    photoUrl: {
      type: String,
      required: [true, 'Foto absen wajib diunggah.']
    },
    photoPublicId: {
      type: String,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, event: 1, dateKey: 1 }, { unique: true });
attendanceSchema.index({ location: '2dsphere' });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
