import mongoose from 'mongoose';

const getConnectionHint = (error) => {
  const message = error?.message || '';

  if (message.includes('IP') || message.includes('whitelist')) {
    return 'Periksa MongoDB Atlas Network Access dan tambahkan IP publik komputer/server ini ke IP Access List.';
  }

  if (message.includes('querySrv')) {
    return 'DNS gagal membaca record SRV Atlas. Jika memakai mongodb+srv, set DNS_SERVERS=8.8.8.8,1.1.1.1 di .env atau gunakan DNS yang mendukung SRV lookup.';
  }

  if (message.includes('tlsv1 alert internal error') || message.includes('SSL routines')) {
    return 'Handshake TLS ke MongoDB Atlas gagal. Biasanya ini terjadi karena IP belum di-allowlist Atlas, jaringan memblokir port 27017, atau URI Atlas tidak sesuai.';
  }

  return null;
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required in the backend environment.');
  }

  mongoose.set('strictQuery', true);

  const connectionOptions = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  };

  if (
    mongoUri.startsWith('mongodb://') &&
    mongoUri.includes('.mongodb.net') &&
    !/[?&](?:tls|ssl)=/i.test(mongoUri)
  ) {
    connectionOptions.tls = true;
  }

  try {
    await mongoose.connect(mongoUri, connectionOptions);
  } catch (error) {
    const hint = getConnectionHint(error);
    const details = hint ? `${error.message}\n${hint}` : error.message;

    throw new Error(`MongoDB connection failed: ${details}`, { cause: error });
  }

  console.log('MongoDB connected');
};

export default connectDB;
