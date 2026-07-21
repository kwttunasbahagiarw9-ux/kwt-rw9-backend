import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, plotLabel } = req.body;

  if (fullName !== undefined) {
    if (typeof fullName !== 'string' || fullName.trim().length === 0 || fullName.trim().length > 80) {
      const error = new Error('Nama lengkap harus 1-80 karakter.');
      error.statusCode = 400;
      throw error;
    }
  }

  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (plotLabel !== undefined) updates.plotLabel = plotLabel.trim();

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  });

  res.json({ message: 'Profil berhasil diperbarui.', user: user.toJSON() });
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('Silakan pilih file gambar terlebih dahulu.');
    error.statusCode = 400;
    throw error;
  }

  if (!isCloudinaryConfigured()) {
    const error = new Error('Cloudinary belum dikonfigurasi pada server.');
    error.statusCode = 500;
    throw error;
  }

  const user = await User.findById(req.user._id);

  if (user.avatarPublicId) {
    try {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    } catch {
      // ignore if old avatar fails to delete
    }
  }

  const { url, publicId } = await uploadBufferToCloudinary(req.file, 'kwt-rw9/avatars');

  user.avatarUrl = url;
  user.avatarPublicId = publicId;
  await user.save();

  res.json({ message: 'Foto profil berhasil diperbarui.', user: user.toJSON() });
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.avatarPublicId) {
    try {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    } catch {
      // ignore if cloudinary delete fails
    }
  }

  user.avatarUrl = '';
  user.avatarPublicId = '';
  await user.save();

  res.json({ message: 'Foto profil berhasil dihapus.', user: user.toJSON() });
});
