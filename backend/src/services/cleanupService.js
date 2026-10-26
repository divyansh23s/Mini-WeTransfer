const SharedLink = require('../models/SharedLink');
const File = require('../models/File');
const storage = require('./fileStorageService');
const logger = require('../config/logger');

let cleanupInProgress = false;

async function cleanupExpiredFiles(now = new Date()) {
  if (cleanupInProgress) return { skipped: true, reason: 'cleanup already running' };
  cleanupInProgress = true;
  try {
    const expiredLinks = await SharedLink.find({ expiresAt: { $lte: now } })
      .select('_id file').lean();

    if (expiredLinks.length === 0) return { linksDeleted: 0, filesDeleted: 0 };
    const linkIds = expiredLinks.map((link) => link._id);
    const fileIds = [...new Set(expiredLinks.map((link) => String(link.file)))];
    await SharedLink.deleteMany({ _id: { $in: linkIds } });

    let filesDeleted = 0;
    for (const fileId of fileIds) {
      const stillShareable = await SharedLink.exists({
        file: fileId,
        expiresAt: { $gt: now },
        revokedAt: null,
        $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
      });
      if (stillShareable) continue;

      const file = await File.findOne({ _id: fileId, status: 'active' }).select('+storageKey');
      if (!file) continue;
      await storage.removeFile(file.storageKey);
      await SharedLink.deleteMany({ file: file._id });
      await File.deleteOne({ _id: file._id });
      filesDeleted += 1;
    }

    const result = { linksDeleted: expiredLinks.length, filesDeleted };
    logger.info('expired resource cleanup completed', result);
    return result;
  } catch (error) {
    logger.error('expired resource cleanup failed', { message: error.message, stack: error.stack });
    throw error;
  } finally {
    cleanupInProgress = false;
  }
}

module.exports = { cleanupExpiredFiles };
