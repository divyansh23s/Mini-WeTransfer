const DEFAULT_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const MAX_LINK_DOWNLOADS = 100;
const ALLOWED_FILE_TYPES = Object.freeze({
  '.pdf': new Set(['application/pdf']),
  '.png': new Set(['image/png']),
  '.jpg': new Set(['image/jpeg']),
  '.jpeg': new Set(['image/jpeg']),
  '.gif': new Set(['image/gif']),
  '.webp': new Set(['image/webp'])
});
module.exports = { DEFAULT_MAX_FILE_SIZE_BYTES, MAX_LINK_DOWNLOADS, ALLOWED_FILE_TYPES };
