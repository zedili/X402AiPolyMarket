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
- [x] With explicit owner approval, deployed `Signal402Registry` to Arbitrum Sepolia: https://sepolia.arbiscan.io/address/0xc896eb3b013a60deca7029dc2aa4f0da9a5faf82
- [x] Independently verified the deployment receipt, deployer, zero value, runtime bytecode, and function-call behavior.
- [x] Sourcify exact-match source verification: https://repo.sourcify.dev/421614/0xc896eB3B013a60deCA7029dc2aa4F0da9a5faf82

## Judge materials

- [x] Repository: https://github.com/zedili/X402AiPolyMarket
- [x] HackQuest project: https://arbitrum-singapore.hackquest.io/projects/Signal402
- [x] Demo video uploaded to HackQuest.
- [x] Pitch video uploaded to HackQuest.
- [x] Verified that the Demo and Pitch tabs resolve to their corresponding video fields after the tab-transition animation completes.
- [x] Uploaded `front-end/public/images/signal402-project-cover.png` as the HackQuest project cover; confirmed that it persists publicly and raises readiness to 100/100.
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

- [x] Re-ran frontend tests, TypeScript checks, the Next.js production build, contract tests, Go tests, and production HTTP smoke checks on Aug 31, 2026.
- [x] Confirmed the HackQuest-displayed submission window: Sep 14, 2026 01:01 through Oct 4, 2026 23:59 (observed in Asia/Shanghai).
- [x] Reviewed all 14 pages of the official Singapore terms for eligibility, originality, IP, publicity, data sharing, prize, and milestone obligations; see `docs/terms-risk-review.md`.
- [x] Sent the organizer a clarification request on Aug 31, 2026 covering existing-project eligibility, the Oct 1 versus Oct 4 deadline conflict, and disclosed AI-agent assistance.
- [ ] Obtain and record the organizer's written resolution; operate to Oct 1 unless written clarification says otherwise.
- [ ] Preserve the pre-event baseline and complete more-than-trivial development during the official Buildathon window.
- [ ] Reconcile every field against `docs/submission-field-map.md`, including location, prize track, deployment details, and AI-assistance disclosure.
- [x] Owner confirmed `zedili` and `zdl` are the same person and that the other historical project-team contributors authorized submission use.
- [ ] Replace the inherited hero and icon assets during the official event window and record complete provenance; see `docs/ip-provenance-review.md`.
- [ ] Resolve final media rights and repository licensing questions in `docs/ip-provenance-review.md`.
- [ ] Complete a full-slide visual and source audit of the final pitch deck and videos after the in-window update.
- [ ] Obtain explicit owner acceptance of the official terms, including publicity, data sharing, grant-agreement, compliance, tax, and potential milestone obligations.
- [ ] Confirm the HackQuest submission window is currently open before submitting.
- [ ] Obtain explicit owner confirmation for the final submission.
- [ ] Submit Signal402 and save the confirmation page or submission identifier.
