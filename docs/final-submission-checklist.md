# Signal402 final submission checklist

Use this file as the final pre-submit gate for the Arbitrum Open House Singapore Buildathon.

## Product proof

- [x] Production app: https://signal402.vercel.app
- [x] Live public Polymarket data appears in market lists and detail pages.
- [x] DeepSeek is called only from the server and its output is schema-validated.
- [x] `POST /api/analysis` returns x402 v2 payment requirements without payment.
- [x] A 0.01 test-USDC payment settled on Arbitrum Sepolia.
- [x] Settlement receipt: https://sepolia.arbiscan.io/tx/0x7a2eea1ee62ef8f02e2731498f6bb77072db477f33a258af5d8c53106aada4e5
- [x] Post-rotation settlement receipt: https://sepolia.arbiscan.io/tx/0x4c0e782d706b544bb154116457eb8c3d447fe86a1b6e82ca4f94043221cdadf2
- [x] AI/provider failure is covered by a test that proves settlement is not called.
- [x] `Signal402Registry` contract tests and the deployment script pass on a local Hardhat chain.
- [ ] With explicit owner approval, deploy `Signal402Registry` to Arbitrum Sepolia and record its Arbiscan address.

## Judge materials

- [x] Repository: https://github.com/zedili/X402AiPolyMarket
- [x] HackQuest project: https://arbitrum-singapore.hackquest.io/projects/Signal402
- [x] Demo video uploaded to HackQuest.
- [x] Pitch video uploaded to HackQuest.
- [x] Project cover uploaded to HackQuest.
- [x] Project wallet connected: `0x0573f139d21fb3140155567Cba7630d3948F4ea3`.
- [x] Submission copy reviewed: `docs/submission-copy.md`.
- [x] Demo script reviewed: `docs/demo-script.md`.

## Security gate

- [x] No AI key or wallet private key exists in the current tracked tree.
- [x] CI scans tracked files for common credential patterns.
- [x] Production AI key is server-only.
- [x] The historical DeepSeek key is absent from the provider inventory and the [GitHub secret-scanning alert](https://github.com/zedili/X402AiPolyMarket/security/secret-scanning/1) is closed as revoked.
- [x] Rotated the production DeepSeek key, updated Vercel, revoked the previous key, and re-ran the paid readiness check.

## Final external action

- [ ] Re-run CI and production smoke tests after the final code change.
- [ ] Confirm the HackQuest submission window is open.
- [ ] Obtain explicit owner confirmation for the final submission.
- [ ] Submit Signal402 and save the confirmation page or submission identifier.
