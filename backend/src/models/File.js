const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalName: { type: String, required: true, trim: true, maxlength: 255 },
  storageKey: { type: String, required: true, unique: true, select: false },
  mimeType: { type: String, required: true, maxlength: 150 },
  sizeBytes: { type: Number, required: true, min: 1 },
  fileHash: { type: String, required: true, index: true },
  status: { type: String, enum: ['active', 'deleted'], default: 'active', index: true }
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
