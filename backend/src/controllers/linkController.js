
const mongoose = require('mongoose');
const SharedLink = require('../models/SharedLink');
const File = require('../models/File');
const { createOpaqueToken, hashToken } = require('../config/security');
const storage = require('../services/fileStorageService');
const logger = require('../config/logger');

const DEFAULT_EXPIRY_HOURS = 24;
const MAX_EXPIRY_HOURS = 24 * 7;
const DEFAULT_MAX_DOWNLOADS = 1;
const MAX_DOWNLOADS = 100;

async function createLink(req, res, next) {
  try {
    const { fileId } = req.body || {};
    if (!mongoose.isValidObjectId(fileId)) return res.status(400).json({ error: { message: 'A valid fileId is required' } });
    const file = await File.findOne({ _id: fileId, owner: req.user._id, status: 'active' }).select('_id');
    if (!file) return res.status(404).json({ error: { message: 'File not found' } });

    const expiryHours = req.body.expiresInHours === undefined ? DEFAULT_EXPIRY_HOURS : Number(req.body.expiresInHours);
    const maxDownloads = req.body.maxDownloads === undefined ? DEFAULT_MAX_DOWNLOADS : Number(req.body.maxDownloads);
    if (!Number.isFinite(expiryHours) || expiryHours <= 0 || expiryHours > MAX_EXPIRY_HOURS) {
      return res.status(400).json({ error: { message: `expiresInHours must be greater than 0 and no more than ${MAX_EXPIRY_HOURS}` } });
    }
    if (!Number.isInteger(maxDownloads) || maxDownloads < 1 || maxDownloads > MAX_DOWNLOADS) {
      return res.status(400).json({ error: { message: `maxDownloads must be an integer from 1 to ${MAX_DOWNLOADS}` } });
    }

    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const link = await SharedLink.create({
      file: file._id,
      createdBy: req.user._id,
      tokenHash: hashToken(token),
      expiresAt,
      maxDownloads
    });
    return res.status(201).json({
      link: {
        id: link.id,
        downloadPath: `/api/links/${token}`,
        expiresAt: link.expiresAt,
        maxDownloads: link.maxDownloads,
        downloadCount: link.downloadCount
      }
    });
  } catch (error) { return next(error); }
}

async function downloadFile(req, res, next) {
  const token = req.params.token;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return res.status(404).json({ error: { message: 'Link is unavailable' } });
  try {
    const now = new Date();
    // Reserve a download atomically so parallel requests cannot exceed the cap.
    const link = await SharedLink.findOneAndUpdate({
      tokenHash: hashToken(token),
      expiresAt: { $gt: now },
      revokedAt: null,
      $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
    }, { $inc: { downloadCount: 1 } }, { new: true })
      .populate({ path: 'file', select: '+storageKey originalName mimeType sizeBytes status' });

    if (!link || !link.file || link.file.status !== 'active') {
      return res.status(404).json({ error: { message: 'Link is unavailable' } });
    }
    const file = link.file;
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.sizeBytes));
    res.attachment(file.originalName);
    res.setHeader('Content-Type', file.mimeType);
    const stream = storage.createReadStream(file.storageKey);
    stream.on('error', (error) => {
      logger.error('file stream failed', { fileId: String(file._id), message: error.message });
      if (res.headersSent) res.destroy();
      else next(error);
    });
    stream.pipe(res);
  } catch (error) { return next(error); }
}

async function revokeLink(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.linkId)) return res.status(404).json({ error: { message: 'Link not found' } });
  try {
    const link = await SharedLink.findOneAndUpdate(
      { _id: req.params.linkId, createdBy: req.user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
      { new: true }
    ).select('_id revokedAt');
    if (!link) return res.status(404).json({ error: { message: 'Link not found' } });
    return res.json({ link: { id: link.id, revokedAt: link.revokedAt } });
  } catch (error) { return next(error); }
}

module.exports = { createLink, downloadFile, revokeLink };
