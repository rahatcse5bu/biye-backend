const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

test('the server imports without synchronous require(esm) support', () => {
  const result = spawnSync(process.execPath, ['--no-experimental-require-module', '-e', `
    const assert = require('node:assert/strict');
    const app = require('./dist/app').default;
    assert.equal(typeof app, 'function');
    const { sanitizeBlogHtml } = require('./dist/app/modules/blog/blog.sanitize');
    assert.ok(sanitizeBlogHtml('<p>Hello <strong>world</strong></p>').includes('<strong>world</strong>'));
    const cleaned = sanitizeBlogHtml('<script>alert(1)</script><a href="javascript:alert(1)">test</a><img src="https://example.test/a.png" onerror="alert(1)">');
    assert.doesNotMatch(cleaned, /<script|javascript:|onerror=/i);
  `], { cwd: require('node:path').resolve(__dirname, '..'), encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});
