# TODO

## Integration test suite (Stellar testnet)
- [x] Add `tests/integration/` with Vitest tests (separate from unit tests)
- [x] Add helper for Friendbot funding and tx debug logging (ledger + tx hashes)
- [x] Implement gated integration tests (`STELLAR_NETWORK=testnet`)
- [x] Implement scenarios:
  - [x] create invoice → verify on-chain invoice state
  - [x] pay invoice → verify invoice funded + payment record
  - [ ] release funds → verify balances/payouts on-chain (SDK method/contract token semantics pending)
- [x] Add GitHub Actions workflow `integration-test.yml`:
  - [x] run only on PRs labeled `integration`
  - [x] run `vitest run tests/integration/**/*.test.ts`
  - [x] set env vars: `STELLAR_NETWORK=testnet`, `STELLAR_SPLIT_CONTRACT_ID` from secrets
- [x] Ensure no test code commits testnet credentials
- [x] Ensure all test cases have 60s timeout each

