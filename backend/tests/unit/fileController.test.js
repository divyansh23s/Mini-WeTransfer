const File = require('../../src/models/File');
const storage = require('../../src/services/fileStorageService');
const { detectFileType } = require('../../src/services/fileValidationService');
const { scanFile } = require('../../src/services/virusScanService');
const { uploadFile } = require('../../src/controllers/fileController');

jest.mock('../../src/models/File', () => ({ create: jest.fn() }));
jest.mock('../../src/services/fileStorageService', () => ({
  createStorageKey: jest.fn(() => 'abc123'),
  finalizeUpload: jest.fn(),
  hashFile: jest.fn(),
  removeFile: jest.fn(),
  removePath: jest.fn()
}));
jest.mock('../../src/services/fileValidationService', () => ({
  matchesAllowedFileType: jest.fn(() => true),
  detectFileType: jest.fn()
}));
jest.mock('../../src/services/virusScanService', () => ({ scanFile: jest.fn() }));
jest.mock('../../src/config/logger', () => ({ warn: jest.fn(), info: jest.fn(), error: jest.fn() }));

function response() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

test('upload stores verified metadata for the authenticated owner', async () => {
  detectFileType.mockResolvedValue({ mime: 'image/png' });
  scanFile.mockResolvedValue({ status: 'clean' });
  storage.finalizeUpload.mockResolvedValue('/private/abc123');
  storage.hashFile.mockResolvedValue('a'.repeat(64));
  File.create.mockResolvedValue({
    id: 'file-1', originalName: 'photo.png', mimeType: 'image/png', sizeBytes: 8,
    fileHash: 'a'.repeat(64), createdAt: new Date('2026-01-01T00:00:00Z')
  });
  const res = response();
  const next = jest.fn();
  await uploadFile({
    file: { path: '/private/staging/upload.part', originalname: 'photo.png', mimetype: 'image/png', size: 8 },
    user: { _id: 'owner-1' },
    ip: '127.0.0.1'
  }, res, next);
  expect(File.create).toHaveBeenCalledWith(expect.objectContaining({ owner: 'owner-1', storageKey: 'abc123', fileHash: 'a'.repeat(64) }));
  expect(res.status).toHaveBeenCalledWith(201);
  expect(next).not.toHaveBeenCalled();
});
