import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Judul kegiatan wajib diisi.'],
      trim: true,
      maxlength: [100, 'Judul kegiatan maksimal 100 karakter.']
    },
    date: {
      type: Date,
      required: [true, 'Tanggal kegiatan wajib diisi.']
    },
    dateKey: {
      type: String,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: [true, 'Jam mulai wajib diisi.'],
      match: [/^\d{2}:\d{2}$/, 'Format jam mulai harus HH:mm.']
    },
    endTime: {
      type: String,
      match: [/^\d{2}:\d{2}$/, 'Format jam selesai harus HH:mm.']
    },
    location: {
      type: String,
      required: [true, 'Lokasi wajib diisi.'],
      trim: true,
      maxlength: [100, 'Lokasi maksimal 100 karakter.']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Deskripsi maksimal 500 karakter.']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

eventSchema.index({ dateKey: 1, startTime: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
