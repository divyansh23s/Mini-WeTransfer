require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { ensureUploadDirectory } = require('./src/services/fileStorageService');
const { cleanupExpiredFiles } = require('./src/services/cleanupService');
const { getJwtSecret } = require('./src/config/security');
const logger = require('./src/config/logger');
const cron = require('node-cron');

const port = Number(process.env.PORT) || 3000;
let server;
let cleanupTask;

async function start() {
  getJwtSecret();
  await connectDB();
  await ensureUploadDirectory();
  await cleanupExpiredFiles().catch(() => {});
  cleanupTask = cron.schedule('0 * * * *', () => {
    cleanupExpiredFiles().catch((error) => logger.error('scheduled cleanup failed', { message: error.message }));
  });
  server = app.listen(port, () => logger.info('file sharing API started', { port }));
}

function shutdown(signal) {
  logger.info('shutdown requested', { signal });
  if (cleanupTask) cleanupTask.stop();
  if (server) server.close(() => process.exit(0));
  else process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
start().catch((error) => {
  logger.error('could not start API', { message: error.message, stack: error.stack });
  process.exit(1);
});
