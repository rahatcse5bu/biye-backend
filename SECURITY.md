# Security regression checks

Authorization reads the current database role and rejects banned accounts. Token issuance also rejects banned accounts. Photocard endpoints are restricted to admins and limited to 10 requests per minute.

Rate limits use atomic MongoDB counters shared across instances. Expired counters are removed by the `RateLimitBucket.expires_at` TTL index. Forwarded IPs are trusted only when `VERCEL=1`; direct Node deployments use the socket IP. A different reverse proxy requires an explicit trusted-proxy configuration.

The build bundles the patched HTML sanitizer as CommonJS because Vercel's runtime cannot synchronously require its ESM parser. The runtime smoke test disables Node's `require(esm)` support to catch this before deployment. Always run the build before starting the compiled server; Vercel's explicit build command generates the same bundle.

Run the checks against a disposable local MongoDB database:

```sh
SECURITY_TEST_MONGO_URI=mongodb://127.0.0.1:27819/biye_security_test_local pnpm test:security
pnpm test:accounts
ACCOUNTS_TEST_MONGO_URI=mongodb://127.0.0.1:27819/biye_accounts_test_local pnpm test:accounts:integration
pnpm audit
```

The integration checks drop only databases matching their guarded localhost test names. Do not use application database credentials for them.

## Web build dependencies

Production-only audits are clear for the backend, frontend, and admin. The backend's full audit is also clear. Security regression checks, account unit/integration checks, and all three production builds passed on October 19, 2026.

The Next.js frontend and Vite admin retain Tailwind 3 for compatibility. Its transitive `braces` dependency is affected by [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), which has no patched release as of October 19, 2026. This affects processing deeply nested glob patterns during builds and development. The API does not use this dependency. Keep build inputs trusted; replacing Tailwind 3 requires a separate CSS compatibility migration. Audit tools may count several packages for this single underlying advisory.
