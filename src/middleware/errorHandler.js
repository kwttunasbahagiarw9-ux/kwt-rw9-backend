export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: 'Data sudah ada dan tidak boleh duplikat.' });
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ message: details[0] || 'Data tidak valid.', details });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({ message: 'Unggahan foto tidak valid.' });
  }

  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan pada server.'
      : error.message || 'Terjadi kesalahan pada server.';

  res.status(statusCode).json({ message });
};
