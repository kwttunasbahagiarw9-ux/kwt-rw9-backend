import multer from 'multer';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('File harus berupa gambar.'));
    }
    cb(null, true);
  }
});

export const singlePhoto = upload.single('photo');

export const uploadBufferToCloudinary = (file, folder) => {
  if (!file) return Promise.resolve(null);

  if (!isCloudinaryConfigured()) {
    const error = new Error('Cloudinary belum dikonfigurasi pada server.');
    error.statusCode = 500;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(file.buffer);
  });
};
