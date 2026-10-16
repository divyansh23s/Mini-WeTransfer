const path = require('path');
const File = require('../models/File');
const { matchesAllowedFileType, detectFileType } = require('../services/fileValidationService');
const logger = require('../config/logger');
const storage = require('../services/fileStorageService');
const { scanFile } = require('../services/virusScanService');

async function uploadFile(req, res, next) {
  if (!req.file) return res.status(400).json({ error: { message: 'Select a file in the "file" field' } });
  let storageKey;
  try {
    const detected = await detectFileType(req.file.path);
    if (!detected || !matchesAllowedFileType(req.file.originalname, req.file.mimetype, detected.mime)) {
      logger.warn('upload rejected by file signature validation', { ip: req.ip });
      await storage.removePath(req.file.path);
      return res.status(415).json({ error: { message: 'The file contents do not match an allowed file type' } });
    }
    const scan = await scanFile(req.file.path);
    if (scan.status === 'infected') {
      await storage.removePath(req.file.path);
      return res.status(422).json({ error: { message: 'The uploaded file was flagged by the virus scanner' } });
    }
    storageKey = storage.createStorageKey();
    const filePath = await storage.finalizeUpload(req.file.path, storageKey);
    const fileHash = await storage.hashFile(filePath);
    let file;
    try {
      file = await File.create({
        owner: req.user._id,
        originalName: path.basename(req.file.originalname).slice(0, 255),
        storageKey,
        mimeType: detected.mime,
        sizeBytes: req.file.size,
        fileHash
      });
    } catch (error) {
      await storage.removeFile(storageKey);
      throw error;
    }
    return res.status(201).json({ file: {
      id: file.id,
      name: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      fileHash: file.fileHash,
      createdAt: file.createdAt
    } });
  } catch (error) {
    if (storageKey) await storage.removeFile(storageKey).catch(() => {});
    if (req.file) await storage.removePath(req.file.path).catch(() => {});
    return next(error);
  }
}

async function listFiles(req, res, next) {
  try {
    const files = await File.find({ owner: req.user._id, status: 'active' })
      .select('originalName mimeType sizeBytes fileHash createdAt')
      .sort({ createdAt: -1 }).lean();
    return res.json({ files: files.map((file) => ({
      id: file._id,
      name: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      fileHash: file.fileHash,
      createdAt: file.createdAt
    })) });
  } catch (error) { return next(error); }
}
module.exports = { uploadFile, listFiles };
