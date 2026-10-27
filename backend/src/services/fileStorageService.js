const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const { randomUUID } = require('crypto');
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const stagingRoot = path.join(uploadRoot, '.staging');

async function ensureUploadDirectory() {
  await fs.promises.mkdir(stagingRoot, { recursive: true, mode: 0o700 });
  await fs.promises.chmod(uploadRoot, 0o700).catch(() => {});
  await fs.promises.chmod(stagingRoot, 0o700).catch(() => {});
}
function getStagingDirectory() { return stagingRoot; }
async function finalizeUpload(tempPath, storageKey) {
  if (!/^[a-f0-9-]+$/i.test(storageKey)) throw new Error('Invalid storage key');
  await ensureUploadDirectory();
  const destination = path.join(uploadRoot, storageKey);
  await fs.promises.rename(tempPath, destination);
  await fs.promises.chmod(destination, 0o600);
  return destination;
}
async function saveStream(readable, storageKey) {
  await ensureUploadDirectory();
  const destination = path.join(uploadRoot, storageKey);
  await pipeline(readable, fs.createWriteStream(destination, { flags: 'wx', mode: 0o600 }));
  return destination;
}
async function hashFile(filePath) {
  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest('hex');
}
async function removeFile(storageKey) {
  if (!/^[a-f0-9-]+$/i.test(storageKey)) throw new Error('Invalid storage key');
  await fs.promises.rm(path.join(uploadRoot, storageKey), { force: true });
}
async function removePath(filePath) { await fs.promises.rm(filePath, { force: true }); }
function getFilePath(storageKey) {
  if (!/^[a-f0-9-]+$/i.test(storageKey)) throw new Error('Invalid storage key');
  return path.join(uploadRoot, storageKey);
}
function createReadStream(storageKey) { return fs.createReadStream(getFilePath(storageKey)); }
function createStorageKey() { return randomUUID(); }
module.exports = { ensureUploadDirectory, getStagingDirectory, finalizeUpload, saveStream, hashFile, removeFile, removePath, getFilePath, createReadStream, createStorageKey };
