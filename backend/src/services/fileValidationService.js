const path = require('path');
const { ALLOWED_FILE_TYPES } = require('../utils/constants');

function matchesAllowedFileType(originalName, declaredMime, detectedMime) {
  const extension = path.extname(originalName || '').toLowerCase();
  const allowedMimes = ALLOWED_FILE_TYPES[extension];
  return Boolean(allowedMimes && allowedMimes.has(declaredMime) && declaredMime === detectedMime);
}

async function detectFileType(filePath) {
  const { fileTypeFromFile } = await import('file-type');
  return fileTypeFromFile(filePath);
}

module.exports = { matchesAllowedFileType, detectFileType };
