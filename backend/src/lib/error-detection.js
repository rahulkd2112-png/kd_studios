function isDatabaseUnavailableError(error) {
  const message = String(error?.message || error?.stack || String(error || ''));
  const text = `${message}`;
  return /prisma|database|tls connection|can't reach|connection.*failed|credentials are available|ssl|timeout/i.test(text);
}

module.exports = { isDatabaseUnavailableError };
