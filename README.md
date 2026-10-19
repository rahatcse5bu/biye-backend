# PNC-Nikah-Back-End

Realtime browser notifications require the backend environment variable `ABLY_API_KEY`. Keep this key server-side; browser clients receive scoped tokens from `/api/v1/notifications/ably-token`.

## Admin accounts

`/api/admin/accounts` supports listing and adding ledger entries; `PATCH /api/admin/accounts/:id` edits an entry. All endpoints require an admin bearer token. Entry types are `expense`, `income`, and `investment`; investments are capital contributed to the business. Amounts use BDT with up to two decimal places and are stored as integer paisa. Summary totals cover all entries regardless of search, type filters, or pagination. Customer payments are not automatically added to this manual ledger.

Run validation checks with `pnpm test:accounts`. For persistence and authorization checks, start a disposable local MongoDB and run `ACCOUNTS_TEST_MONGO_URI=mongodb://127.0.0.1:27017/biye_accounts_test_local pnpm test:accounts:integration`. The integration check creates test users and drops that test database afterward; only localhost database names beginning with `biye_accounts_test_` are accepted.
