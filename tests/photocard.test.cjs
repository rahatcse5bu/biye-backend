const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'photocard-security-test-secret';
const router = require('../dist/app/modules/photocard/photocard.route').default;
const { UserInfoModel } = require('../dist/app/modules/user_info/user_info.model');

test('all photocard endpoints require an admin and enforce generation limits', async () => {
  const uri = process.env.SECURITY_TEST_MONGO_URI;
  assert.match(uri || '', /^mongodb:\/\/127\.0\.0\.1:\d+\/biye_security_test_[a-z0-9_]+$/);
  await mongoose.connect(uri);
  const app = express();
  app.use('/photocard', router);
  app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const originalNow = Date.now;
  const now = originalNow();
  Date.now = () => now;
  try {
    const users = await UserInfoModel.create([
      { user_id: 1, email: 'admin@photocard.test', user_role: 'admin' },
      { user_id: 2, email: 'user@photocard.test', user_role: 'user' },
    ]);
    const tokens = users.map((user) => jwt.sign({ _id: String(user._id), user_role: user.user_role }, process.env.JWT_SECRET));
    const base = `http://127.0.0.1:${server.address().port}/photocard/507f1f77bcf86cd799439011`;
    const request = (suffix, token) => fetch(base + suffix, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    for (const suffix of ['', '/data', '/download', '/download/svg', '/download/png']) {
      assert.equal((await request(suffix)).status, 401);
      assert.equal((await request(suffix, tokens[1])).status, 403);
      assert.equal((await request(suffix, tokens[0])).status, 404);
    }
    for (let i = 0; i < 5; i++) assert.equal((await request('', tokens[0])).status, 404);
    assert.equal((await request('', tokens[0])).status, 429);
  } finally {
    Date.now = originalNow;
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
