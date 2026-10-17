const assert = require('node:assert/strict');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function run(onReady) {
  const uri = process.env.ACCOUNTS_TEST_MONGO_URI;
  assert.ok(uri && /^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/biye_accounts_test_[a-z0-9_]+(?:\?|$)/.test(uri), 'Use a disposable localhost database named biye_accounts_test_*');
  process.env.JWT_SECRET = 'accounts-test-secret-only';
  const router = require('../dist/app/modules/accounts/accounts.route').default;
  const { UserInfoModel } = require('../dist/app/modules/user_info/user_info.model');
  const { AccountsEntry } = require('../dist/app/modules/accounts/accounts.model');
  await mongoose.connect(uri);
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/admin/accounts', router);
  app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const users = await UserInfoModel.create([
      { user_id: 1, email: 'admin@accounts.test', user_role: 'admin' },
      { user_id: 2, email: 'customer@accounts.test', user_role: 'user' },
      { user_id: 3, email: 'other-admin@accounts.test', user_role: 'admin' },
    ]);
    const tokens = users.map((user) => jwt.sign({ _id: String(user._id), user_role: user.user_role }, process.env.JWT_SECRET, { expiresIn: '1h' }));
    const request = async (method, path = '', body, token = tokens[0]) => {
      const response = await fetch(`${url}/api/admin/accounts${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, body: await response.json() };
    };
    const expense = { type: 'expense', amount: '200.10', date: '2026-10-17', category: 'Hosting [monthly]', person: 'Provider', notes: 'Server bill' };
    for (const method of ['GET', 'POST', 'PATCH']) {
      const path = method === 'PATCH' ? `/${new mongoose.Types.ObjectId()}` : '';
      assert.equal((await request(method, path, method === 'GET' ? undefined : expense, '')).status, 401);
      assert.equal((await request(method, path, method === 'GET' ? undefined : expense, tokens[1])).status, 403);
    }
    assert.deepEqual((await request('GET')).body.data.summary, { income: 0, investment: 0, expense: 0, balance: 0 });
    for (const change of [{ amount: '-1' }, { amount: '1.001' }, { date: '2026-02-30' }, { type: 'other' }, { createdBy: String(users[1]._id) }]) {
      assert.equal((await request('POST', '', { ...expense, ...change })).status, 400);
    }
    assert.equal(await AccountsEntry.countDocuments(), 0);
    const income = await request('POST', '', { ...expense, type: 'income', amount: '500.25', category: 'Income' });
    const investment = await request('POST', '', { ...expense, type: 'investment', amount: '1000', category: 'Founder capital' });
    const created = await request('POST', '', expense);
    for (const result of [income, investment, created]) assert.equal(result.status, 201);
    assert.equal(created.body.data.amount, 200.10);
    let list = (await request('GET', '?limit=2')).body.data;
    assert.equal(list.entries.length, 2);
    assert.equal(list.pagination.totalItems, 3);
    assert.equal(list.pagination.totalPages, 2);
    assert.deepEqual(list.summary, { income: 500.25, investment: 1000, expense: 200.10, balance: 1300.15 });
    assert.equal((await request('GET', '?limit=2&page=2')).body.data.entries.length, 1);
    const filtered = (await request('GET', '?type=expense&search=%5Bmonthly%5D')).body.data;
    assert.equal(filtered.entries.length, 1);
    assert.equal(filtered.summary.balance, 1300.15);
    const id = created.body.data._id;
    const updated = await request('PATCH', `/${id}`, { ...expense, amount: '300.10', notes: 'Corrected bill' }, tokens[2]);
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.amount, 300.10);
    assert.equal(updated.body.data.createdBy, String(users[0]._id));
    assert.equal(updated.body.data.updatedBy, String(users[2]._id));
    assert.equal((await request('PATCH', `/${id}`, { ...expense, amount: '0' })).status, 400);
    assert.equal((await request('PATCH', '/invalid-id', expense)).status, 400);
    assert.equal((await request('PATCH', `/${new mongoose.Types.ObjectId()}`, expense)).status, 404);
    assert.equal((await request('GET', '?page=-1')).status, 400);
    await mongoose.disconnect();
    await mongoose.connect(uri);
    list = (await request('GET')).body.data;
    assert.equal(list.summary.balance, 1200.15);
    assert.equal(list.entries.find((entry) => entry._id === id).notes, 'Corrected bill');
    console.log('Accounts API checks passed: real persistence, edits, exact totals, search, pagination, validation, 401 and 403');
    if (onReady) {
      await AccountsEntry.deleteMany({});
      await onReady({ url, token: tokens[0], user: { _id: String(users[0]._id), user_role: 'admin', email: users[0].email, user_name: 'Test Admin' } });
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

module.exports = { run };
if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; });
