const mongoose = require('mongoose');

const sharedLinkSchema = new mongoose.Schema({
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // The raw bearer token is returned once; only its SHA-256 digest is persisted.
  tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true, index: true },
  maxDownloads: { type: Number, required: true, min: 1 },
  downloadCount: { type: Number, default: 0, min: 0 },
  revokedAt: { type: Date, default: null }
}, { timestamps: true });

// No TTL index: the hourly cleanup worker needs expired links to clean their files.
sharedLinkSchema.set('autoIndex', false);

module.exports = mongoose.model('SharedLink', sharedLinkSchema);
