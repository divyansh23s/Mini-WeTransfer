const { matchesAllowedFileType } = require('../../src/services/fileValidationService');

describe('upload file type validation', () => {
  test('accepts an allowlisted extension with matching declared and detected MIME types', () => {
    expect(matchesAllowedFileType('report.pdf', 'application/pdf', 'application/pdf')).toBe(true);
  });

  test('rejects script extensions and mismatched file signatures', () => {
    expect(matchesAllowedFileType('payload.exe', 'application/pdf', 'application/pdf')).toBe(false);
    expect(matchesAllowedFileType('photo.png', 'image/png', 'text/html')).toBe(false);
  });
});
