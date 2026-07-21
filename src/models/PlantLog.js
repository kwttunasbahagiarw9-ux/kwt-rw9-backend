import mongoose from 'mongoose';

const plantLogSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true
    },
    dateKey: {
      type: String,
      required: true,
      index: true
    },
    condition: {
      type: String,
      enum: ['Healthy', 'Wilting', 'Pest-affected', 'Dead'],
      required: [true, 'Kondisi tanaman wajib dipilih.']
    },
    growthStage: {
      type: String,
      enum: ['Seedling', 'Growing', 'Flowering', 'Harvest-ready'],
      required: [true, 'Tahap pertumbuhan wajib dipilih.']
    },
    note: {
      type: String,
      trim: true,
      maxlength: [180, 'Catatan maksimal 180 karakter.']
    },
    photoUrl: {
      type: String
    },
    photoPublicId: {
      type: String
    }
  },
  { timestamps: true }
);

plantLogSchema.index({ dateKey: -1, condition: 1 });

const PlantLog = mongoose.model('PlantLog', plantLogSchema);

export default PlantLog;
