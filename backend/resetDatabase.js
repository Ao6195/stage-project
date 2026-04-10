const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const MONGO_URI = typeof process.env.MONGO_URI === 'string' ? process.env.MONGO_URI.trim() : '';
const MONGO_DB_NAME =
  typeof process.env.MONGO_DB_NAME === 'string' && process.env.MONGO_DB_NAME.trim()
    ? process.env.MONGO_DB_NAME.trim()
    : 'itdoc';

async function resetDatabase() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is missing.');
  }

  await mongoose.connect(MONGO_URI, {
    dbName: MONGO_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  await mongoose.connection.db.dropDatabase();
}

resetDatabase()
  .then(async () => {
    console.log(`Database "${MONGO_DB_NAME}" reset successfully.`);
    console.log('Local in-memory fallback will be empty after the server restarts.');
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error('Database reset failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
