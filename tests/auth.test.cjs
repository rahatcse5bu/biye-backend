const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'security-regression-test-secret';
const { auth } = require('../dist/app/middlewares/auth');
const { UserInfoModel } = require('../dist/app/modules/user_info/user_info.model');
const id = '507f1f77bcf86cd799439011';

async function authorize(account, tokenRole, requiredRoles) {
  const original = UserInfoModel.findById;
  UserInfoModel.findById = () => ({ select: () => ({ lean: async () => account }) });
  const req = { headers: { authorization: `Bearer ${jwt.sign({ _id: id, user_role: tokenRole }, process.env.JWT_SECRET)}` } };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, send() { return this; } };
  let accepted = false;
  try {
    await auth(...requiredRoles)(req, res, () => { accepted = true; });
    return { accepted, status: res.statusCode, user: req.user };
  } finally {
    UserInfoModel.findById = original;
  }
}

test('a demoted admin cannot use an old admin token', async () => {
  const result = await authorize({ _id: id, user_role: 'user', user_status: 'active' }, 'admin', ['admin']);
  assert.equal(result.accepted, false);
  assert.equal(result.status, 403);
});

test('downstream handlers receive the current database role', async () => {
  const result = await authorize({ _id: id, user_role: 'user', user_status: 'active' }, 'admin', ['user', 'admin']);
  assert.equal(result.accepted, true);
  assert.equal(result.user.user_role, 'user');
});

test('current admins retain admin access', async () => {
  assert.equal((await authorize({ _id: id, user_role: 'admin', user_status: 'active' }, 'admin', ['admin'])).accepted, true);
});

test('deleted accounts and password-revoked sessions remain rejected', async () => {
  assert.equal((await authorize(null, 'admin', ['admin'])).status, 401);
  assert.equal((await authorize({ user_role: 'admin', password_changed_at: new Date(Date.now() + 10000) }, 'admin', ['admin'])).status, 401);
});

test('banned users and admins cannot use existing sessions', async () => {
  for (const role of ['user', 'admin']) {
    const result = await authorize({ _id: id, user_role: role, user_status: 'banned' }, role, [role]);
    assert.equal(result.accepted, false);
    assert.equal(result.status, 403);
  }
});

test('pending users can still complete their profile', async () => {
  assert.equal((await authorize({ _id: id, user_role: 'user', user_status: 'pending' }, 'user', ['user'])).accepted, true);
});

test('password login cannot issue a token for a banned account', async () => {
  const { scryptSync } = require('node:crypto');
  const { UserInfoService } = require('../dist/app/modules/user_info/user_info.services');
  const original = UserInfoModel.findOne;
  const salt = 'test-salt';
  const user = { _id: id, user_role: 'user', user_status: 'banned', password_hash: `${salt}:${scryptSync('correct-password', salt, 64).toString('hex')}` };
  UserInfoModel.findOne = () => ({ select: async () => user });
  try {
    await assert.rejects(UserInfoService.login({ email: 'banned@example.test', password: 'correct-password' }), (error) => error.statusCode === 403);
  } finally {
    UserInfoModel.findOne = original;
  }
});

test('Google login cannot issue a token for a banned account', async () => {
  const { OAuth2Client } = require('google-auth-library');
  const config = require('../dist/config').default;
  const { UserInfoService } = require('../dist/app/modules/user_info/user_info.services');
  const originalFind = UserInfoModel.findOne;
  const originalVerify = OAuth2Client.prototype.verifyIdToken;
  const originalClientId = config.google_client_id;
  const user = { _id: id, user_role: 'user', user_status: 'banned', google_id: 'google-sub', email: 'banned@example.test', username: 'Banned', save: async () => {} };
  config.google_client_id = 'test-client';
  OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => ({ sub: 'google-sub', email: user.email, email_verified: true }) });
  UserInfoModel.findOne = async () => user;
  try {
    await assert.rejects(UserInfoService.googleAuth({ credential: 'mock-credential' }), (error) => error.statusCode === 403);
  } finally {
    UserInfoModel.findOne = originalFind;
    OAuth2Client.prototype.verifyIdToken = originalVerify;
    config.google_client_id = originalClientId;
  }
});
