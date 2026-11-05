const SharedLink = require('../../src/models/SharedLink');
const File = require('../../src/models/File');
const storage = require('../../src/services/fileStorageService');
const { cleanupExpiredFiles } = require('../../src/services/cleanupService');

jest.mock('../../src/models/SharedLink', () => ({ find: jest.fn(), deleteMany: jest.fn(), exists: jest.fn() }));
jest.mock('../../src/models/File', () => ({ findOne: jest.fn(), deleteOne: jest.fn() }));
jest.mock('../../src/services/fileStorageService', () => ({ removeFile: jest.fn() }));
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), error: jest.fn() }));

test('hourly cleanup removes an expired link and its now-unshared file', async () => {
  SharedLink.find.mockReturnValue({ select: () => ({ lean: async () => [{ _id: 'link-1', file: 'file-1' }] }) });
  SharedLink.deleteMany.mockResolvedValue({ deletedCount: 1 });
  SharedLink.exists.mockResolvedValue(null);
  File.findOne.mockReturnValue({ select: () => Promise.resolve({ storageKey: 'a'.repeat(36) }) });
  File.deleteOne.mockResolvedValue({ deletedCount: 1 });
  storage.removeFile.mockResolvedValue();

  const result = await cleanupExpiredFiles(new Date('2030-01-01T00:00:00.000Z'));
  expect(result).toEqual({ linksDeleted: 1, filesDeleted: 1 });
  expect(storage.removeFile).toHaveBeenCalledWith('a'.repeat(36));
});
