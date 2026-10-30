const { execFile } = require('child_process');
const { promisify } = require('util');
const run = promisify(execFile);

async function scanFile(filePath) {
  if (process.env.CLAMAV_ENABLED !== 'true') return { status: 'skipped' };
  const command = process.env.CLAMAV_SCAN_COMMAND || 'clamdscan';
  try {
    await run(command, ['--no-summary', filePath], { timeout: 120000, maxBuffer: 1024 * 1024 });
    return { status: 'clean' };
  } catch (error) {
    if (error.code === 1) return { status: 'infected' };
    const unavailable = new Error('Virus scanning is enabled but ClamAV could not complete the scan');
    unavailable.statusCode = 503;
    throw unavailable;
  }
}
module.exports = { scanFile };
