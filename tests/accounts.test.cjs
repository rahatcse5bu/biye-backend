const assert = require('node:assert/strict');
const { entrySchema, amountToPaisa } = require('../dist/app/modules/accounts/accounts.validation');

const valid = { type: 'expense', amount: '120.35', date: '2026-10-17', category: 'Hosting', person: 'Provider', notes: '' };
assert.equal(amountToPaisa('0.29'), 29);
assert.equal(amountToPaisa('120.35'), 12035);
assert.equal(amountToPaisa('100'), 10000);
assert.equal(entrySchema.parse(valid).amountPaisa, 12035);
for (const amount of ['0', '-1', '1.001', 'NaN', '', '1e3', '1000000000', Infinity]) {
  assert.equal(entrySchema.safeParse({ ...valid, amount }).success, false, `reject ${amount}`);
}
for (const date of ['2026-02-30', '2026-13-01', '17-10-2026', '']) {
  assert.equal(entrySchema.safeParse({ ...valid, date }).success, false, `reject ${date}`);
}
assert.equal(entrySchema.safeParse({ ...valid, category: '  ' }).success, false);
assert.equal(entrySchema.safeParse({ ...valid, type: 'withdrawal' }).success, false);
assert.equal(entrySchema.safeParse({ ...valid, amountPaisa: 1 }).success, false);
console.log('Accounts amount and validation checks passed');
