const test = require('node:test');
const assert = require('node:assert/strict');
const { isDatabaseUnavailableError } = require('../src/lib/error-detection');

test('recognizes database errors from Prisma stack text when the Error.message field is empty', () => {
  const error = new Error('');
  error.stack = `PrismaClientInitializationError: Invalid \`prisma.user.findUnique()\` invocation in
C:\\Users\\rahul\\OneDrive\\Desktop\\KD_Studios\\backend\\src\\services\\auth-service.js:126:36

Can't reach database server at \`ep-still-surf-aosn30b7-pooler.c-2.ap-southeast-1.aws.neon.tech:5432\`

Please make sure your database server is running at \`ep-still-surf-aosn30b7-pooler.c-2.ap-southeast-1.aws.neon.tech:5432\`.`;

  assert.equal(isDatabaseUnavailableError(error), true);
});
