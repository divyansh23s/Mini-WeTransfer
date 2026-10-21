const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ALLOWED_FILE_TYPES, DEFAULT_MAX_FILE_SIZE_BYTES } = require('../utils/constants');
const { ensureUploadDirectory, getStagingDirectory } = require('../services/fileStorageService');

const requestedMaxMb = Number(process.env.MAX_FILE_SIZE_MB || 100);
const maxBytes = Number.isFinite(requestedMaxMb) && requestedMaxMb > 0
  ? Math.min(requestedMaxMb * 1024 * 1024, DEFAULT_MAX_FILE_SIZE_BYTES)
  : DEFAULT_MAX_FILE_SIZE_BYTES;
const storage = multer.diskStorage({
  destination(req, file, callback) {
    ensureUploadDirectory().then(() => callback(null, getStagingDirectory()), callback);
  },
  filename(req, file, callback) { callback(null, `${Date.now()}-${require('crypto').randomUUID()}.part`); }
});

function fileFilter(req, file, callback) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const allowedMimes = ALLOWED_FILE_TYPES[extension];
  if (!allowedMimes || !allowedMimes.has(file.mimetype)) {
    const error = new Error('Unsupported file type. Allowed types: PDF, PNG, JPG, GIF, WEBP.');
    error.statusCode = 415;
    return callback(error);
  }
  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxBytes, files: 1, fields: 0 }
});

module.exports = { upload };
