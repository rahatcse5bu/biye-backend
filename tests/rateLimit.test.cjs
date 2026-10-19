const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const mongoose = require('mongoose');
const { rateLimit } = require('../dist/shared/rateLimit');
const { RateLimitBucket } = require('../dist/shared/rateLimit.model');

test('rate limits share counters across instances and ignore spoofed IP headers', async () => {
  const uri = process.env.SECURITY_TEST_MONGO_URI;
  assert.match(uri || '', /^mongodb:\/\/127\.0\.0\.1:\d+\/biye_security_test_[a-z0-9_]+$/);
  await mongoose.connect(uri);
  const servers = [];
  const originalNow = Date.now;
  let now = Math.floor(originalNow() / 60000) * 60000 + 1000;
  Date.now = () => now;
  try {
    const urls = [];
    for (let i = 0; i < 2; i++) {
      const app = express();
      app.set('trust proxy', 1);
      app.get('/', rateLimit({ name: 'regression', windowMs: 60000, max: 2 }), (_req, res) => res.sendStatus(204));
      app.use((error, _req, res, _next) => res.status(503).send('Unavailable'));
      const server = app.listen(0, '127.0.0.1');
      servers.push(server);
      await new Promise((resolve) => server.once('listening', resolve));
      urls.push(`http://127.0.0.1:${server.address().port}`);
    }
    const request = (url, headers = {}) => fetch(url, { headers: { 'x-forwarded-for': '198.51.100.7', ...headers } });
    assert.equal((await request(urls[0], { 'x-real-ip': '1.2.3.4' })).status, 204);
    assert.equal((await request(urls[1], { 'x-real-ip': '5.6.7.8' })).status, 204);
    const blocked = await request(urls[0], { 'x-real-ip': '9.10.11.12', 'x-forwarded-for': 'spoofed, 198.51.100.7' });
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    assert.equal((await request(urls[0], { 'x-forwarded-for': '198.51.100.8' })).status, 204);

    const concurrent = await Promise.all(Array.from({ length: 8 }, (_, i) => request(urls[i % 2], { 'x-forwarded-for': '198.51.100.9' })));
    assert.equal(concurrent.filter((res) => res.status === 204).length, 2);
    assert.equal(concurrent.filter((res) => res.status === 429).length, 6);
    now += 60000;
    assert.equal((await request(urls[1])).status, 204);
    const originalUpdate = RateLimitBucket.findOneAndUpdate;
    RateLimitBucket.findOneAndUpdate = () => { throw new Error('Storage unavailable'); };
    try {
      assert.equal((await request(urls[0])).status, 503);
    } finally {
      RateLimitBucket.findOneAndUpdate = originalUpdate;
    }
  } finally {
    Date.now = originalNow;
    await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
