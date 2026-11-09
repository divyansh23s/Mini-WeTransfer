const SharedLink = require('../../src/models/SharedLink');
const File = require('../../src/models/File');
const { downloadFile, createLink } = require('../../src/controllers/linkController');

jest.mock('../../src/models/SharedLink', () => ({ create: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../../src/models/File', () => ({ findOne: jest.fn() }));
jest.mock('../../src/config/logger', () => ({ warn: jest.fn(), info: jest.fn(), error: jest.fn() }));

function response() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('expiring link controller', () => {
  test('download rejects expired, exhausted, revoked, or unknown links uniformly', async () => {
    const populate = jest.fn().mockResolvedValue(null);
    SharedLink.findOneAndUpdate.mockReturnValue({ populate });
    const res = response();
    const token = 'A'.repeat(43);
    await downloadFile({ params: { token } }, res, jest.fn());
    expect(SharedLink.findOneAndUpdate.mock.calls[0][0]).toEqual(expect.objectContaining({
      expiresAt: expect.objectContaining({ $gt: expect.any(Date) }),
      revokedAt: null,
      $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
    }));
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('creates a one-time token for a file owned by the caller', async () => {
    const fileId = '507f1f77bcf86cd799439011';
    File.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: fileId }) });
    SharedLink.create.mockImplementation(async (data) => ({ id: 'link-1', ...data }));
    const res = response();
    await createLink({ user: { _id: 'owner-1' }, body: { fileId, expiresInHours: 4, maxDownloads: 2 } }, res, jest.fn());
    const saved = SharedLink.create.mock.calls[0][0];
    expect(saved.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.maxDownloads).toBe(2);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].link.downloadPath).toMatch(/^\/api\/links\/[A-Za-z0-9_-]{43}$/);
  });
});
