const mongoose = require('mongoose');
const logger = require('./logger');

async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is required');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);

  const SharedLink = require('../models/SharedLink');
  const collection = mongoose.connection.collection(SharedLink.collection.collectionName);
  const indexes = await collection.listIndexes().toArray().catch((error) => {
    if (error.code === 26 || error.codeName === 'NamespaceNotFound') return [];
    throw error;
  });
  for (const index of indexes) {
    if (index.key && index.key.expiresAt === 1 && index.expireAfterSeconds !== undefined) {
      await collection.dropIndex(index.name);
      logger.info('removed legacy shared-link TTL index', { index: index.name });
    }
  }
  await SharedLink.createIndexes();
  return mongoose.connection;
}

module.exports = connectDB;
