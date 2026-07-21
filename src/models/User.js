import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username wajib diisi.'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username minimal 3 karakter.'],
      maxlength: [40, 'Username maksimal 40 karakter.']
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@gmail\.com$/, 'Alamat Gmail tidak valid.']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password wajib diisi.']
    },
    fullName: {
      type: String,
      required: [true, 'Nama lengkap wajib diisi.'],
      trim: true,
      maxlength: [80, 'Nama lengkap maksimal 80 karakter.']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [24, 'Nomor telepon maksimal 24 karakter.']
    },
    plotLabel: {
      type: String,
      trim: true,
      maxlength: [60, 'Label lahan maksimal 60 karakter.']
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    avatarPublicId: {
      type: String,
      default: ''
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
