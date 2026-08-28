# Signal402 — submission copy

## One-line pitch

Signal402 lets people and autonomous agents purchase one structured prediction-market report with one non-custodial x402 USDC payment on Arbitrum.

## Short description

Signal402 is a pay-per-request market-intelligence layer built for the Arbitrum Open House Singapore Buildathon. Users browse live Polymarket events for free, select a market, and unlock a structured AI report for 0.01 USDC on Arbitrum Sepolia. The protected endpoint uses x402 v2 to advertise payment terms, verify browser-wallet authorization, generate a server-side report, and settle only after the report succeeds. Signal402 never custodies user funds and never places trades.

## Problem

Prediction-market probabilities are public, but contextual analysis is usually bundled into subscriptions, accounts, dashboards, or private API contracts. That model is awkward for occasional users and especially awkward for autonomous agents that need to buy one bounded result with explicit machine-readable terms.

## Solution

Signal402 turns one report into one transaction:

1. Inspect live Polymarket markets and source data for free.
2. Receive an x402 payment requirement with an exact price and network.
3. Authorize 0.01 USDC from a browser wallet on Arbitrum Sepolia.
4. Receive a structured report containing the market probability, an independent estimate, evidence, counterarguments, risks, and assumptions.
5. Settle payment only after a valid result is generated.

## How we use Arbitrum

- Network: Arbitrum Sepolia (`eip155:421614`).
- Payment: 0.01 test USDC per successful report.
- Protocol: x402 v2, `exact` EVM scheme, with browser-wallet EIP-3009 authorization.
- Settlement: facilitator-backed verification and settlement; Signal402 holds no facilitator private key and does not custody user funds.
- Attestation registry: optional hash-only attestations at `0xc896eb3b013a60deca7029dc2aa4f0da9a5faf82` on Arbitrum Sepolia.

## Technical stack

- Next.js and TypeScript for the product and server routes.
- Polymarket Gamma API for live prediction-market snapshots.
- DeepSeek for server-side structured analysis with strict JSON validation.
- Official `@x402/core`, `@x402/evm`, and `@x402/fetch` packages.
- Arbitrum Sepolia and Circle test USDC.
- Vitest, Hardhat, Go tests, and GitHub Actions CI.

## What makes it different

The innovation is not simply “AI plus markets.” Signal402 defines a clean commercial and technical boundary around a single information response. Price and payment terms are machine-readable; the app is non-custodial; AI credentials remain server-side; and provider failure cancels settlement rather than charging for an unusable result.

## Judging-criteria fit

- **Smart contract quality:** a minimal hash-only attestation registry with active Hardhat tests, plus a production x402 flow that uses official SDK packages and fails closed before settlement.
- **Product-Market Fit:** a transparent 0.01 test-USDC unit price for occasional users and autonomous agents that need one bounded result rather than a subscription.
- **Innovation and Creativity:** an atomic, machine-readable commercial boundary around a structured AI response—not merely an AI chat interface attached to market data.
- **Real Problem Solving:** direct access to contextual market analysis without custody, trade execution, an account, or a recurring plan.

Signal402 is an MVP with verified technical execution; it does not yet claim users, revenue, retention, or prediction-accuracy validation.

## Accomplishments

- Replaced mock market fixtures with live Polymarket data.
- Replaced a mock/permissive payment flow with a real x402 v2 gate.
- Added Arbitrum Sepolia browser-wallet authorization and facilitator settlement.
- Added strict server-side report validation and fail-closed settlement behavior.
- Added protocol, smart-contract, backend, frontend, build, and dependency-audit checks.
- Deployed and independently verified the optional `Signal402Registry` hash-attestation contract on Arbitrum Sepolia.
- Deployed the permanent production app and verified that it returns live market data and a valid x402 `402 Payment Required` response.

## Challenges

The hardest part was treating payment and AI generation as one reliable transaction. A naïve implementation can verify payment too late, settle despite provider failure, expose AI credentials, or trust stale client-side market data. The final architecture refreshes the market snapshot server-side, validates the model response, and commits settlement only after success.

## What we learned

x402 is most useful when it is treated as an application boundary, not a checkout widget. The resource description, network, asset, price, verification, provider call, validation, and settlement policy all need to agree. Arbitrum’s low-cost EVM environment makes that boundary practical for small per-request payments.

## Next steps

- Add multi-provider analysis and an evaluation harness.
- Expose an agent-native API with receipts and reusable report schemas.
- Explore publisher/provider revenue sharing without adding custody.

## Verified end-to-end proof

- Production AI readiness endpoint: https://signal402.vercel.app/api/analysis/status
- Successful Arbitrum Sepolia settlement: https://sepolia.arbiscan.io/tx/0x7a2eea1ee62ef8f02e2731498f6bb77072db477f33a258af5d8c53106aada4e5
- Post-key-rotation settlement: https://sepolia.arbiscan.io/tx/0x4c0e782d706b544bb154116457eb8c3d447fe86a1b6e82ca4f94043221cdadf2
- Canonical registry: https://sepolia.arbiscan.io/address/0xc896eb3b013a60deca7029dc2aa4f0da9a5faf82
- Registry deployment: https://sepolia.arbiscan.io/tx/0x5af65b36f980448d63127b73120c6ab40a7b64a7a81cfa977bd8e710765d61f4
- Registry source verification: https://repo.sourcify.dev/421614/0xc896eB3B013a60deCA7029dc2aa4F0da9a5faf82
- Payment amount: 0.01 test USDC (`10000` base units).
- The successful response rendered the structured DeepSeek report and settlement receipt in the production UI.

## Links

- Repository: https://github.com/zedili/X402AiPolyMarket
- Project page: https://arbitrum-singapore.hackquest.io/projects/Signal402
- Production app / demo URL: https://signal402.vercel.app
- Demo video: https://raw.githubusercontent.com/zedili/X402AiPolyMarket/main/docs/media/Signal402-Demo-Video.mp4
- Pitch video: https://raw.githubusercontent.com/zedili/X402AiPolyMarket/main/docs/media/Signal402-Pitch-Video.mp4

## Team

Solo founder and full-stack builder, supported by AI development agents.

## Responsible-use statement

Signal402 provides informational analysis only. It does not guarantee outcomes, manage funds, or execute trades. The Buildathon demo uses testnet assets only.
