import 'dotenv/config';
import dns from 'node:dns';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const dnsServers = (process.env.DNS_SERVERS || '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
  console.log(`Using custom DNS servers: ${dnsServers.join(', ')}`);
}

// For local development
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`KWT RW 9 API running on port ${PORT}`);
    });
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

// For Vercel serverless
let cachedDb = null;
async function connectDBOnce() {
  if (!cachedDb) {
    cachedDb = await connectDB();
  }
  return cachedDb;
}

export default async function handler(req, res) {
  await connectDBOnce();
  return app(req, res);
}
