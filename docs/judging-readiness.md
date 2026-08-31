# Signal402 judging-readiness matrix

This matrix maps Signal402 to the published Arbitrum Open House Singapore
Buildathon criteria. It is a claim-control document for the final submission
and judge Q&A, not a substitute for the working product or onchain evidence.

Source: [official HackQuest event page](https://www.hackquest.io/hackathons/Arbitrum-Open-House-Singapore-Online-Buildathon).

## Qualification

The project must be deployed on an Arbitrum chain. Signal402's protected
production flow has settled x402 payments through the Arbitrum Sepolia USDC
contract, and the UI links to the transaction receipt after success.

- Production: https://signal402.vercel.app
- Network: Arbitrum Sepolia (`eip155:421614`)
- Verified settlement: https://sepolia.arbiscan.io/tx/0x7a2eea1ee62ef8f02e2731498f6bb77072db477f33a258af5d8c53106aada4e5
- Post-key-rotation settlement: https://sepolia.arbiscan.io/tx/0x4c0e782d706b544bb154116457eb8c3d447fe86a1b6e82ca4f94043221cdadf2
- Canonical `Signal402Registry`: https://sepolia.arbiscan.io/address/0xc896eb3b013a60deca7029dc2aa4f0da9a5faf82
- Registry deployment: https://sepolia.arbiscan.io/tx/0x5af65b36f980448d63127b73120c6ab40a7b64a7a81cfa977bd8e710765d61f4
- Exact-match source verification: https://repo.sourcify.dev/421614/0xc896eB3B013a60deCA7029dc2aa4F0da9a5faf82

## Published judging criteria

| Criterion | Current evidence | Honest limitation / next proof |
| --- | --- | --- |
| Smart contract quality | `Signal402Registry` is minimal, permissionless, stores hashes rather than reports or funds, has three active Hardhat tests, and is deployed on Arbitrum Sepolia. Independent RPC checks confirmed the deployment receipt, non-empty runtime bytecode, empty-market rejection, and a successful valid-call simulation. Sourcify reports exact matches for both creation and runtime bytecode. The production payment path uses official x402 packages and settles only after a valid AI result. | The registry is optional and is not required for the core payment path. Arbiscan's automatic source-verification import hit its daily submission limit; use the public Sourcify exact-match record until that separate explorer view is available. |
| Product-Market Fit | One bounded report can be purchased without an account or subscription. The same machine-readable payment boundary works for a person or an autonomous agent. | There is no validated retention, revenue, or user-count evidence yet. Present this as an MVP with a clear buyer and pricing hypothesis, not proven traction. |
| Innovation and Creativity | Signal402 combines live prediction-market probabilities, schema-validated server-side analysis, and a non-custodial x402 pay-per-response boundary on Arbitrum. Provider failure prevents settlement. | Avoid presenting generic "AI plus markets" as the innovation; emphasize the atomic commercial boundary and agent compatibility. |
| Real Problem Solving | Occasional users and agents should not need a recurring subscription or private API contract to buy one piece of market context. The product makes price, network, asset, and receipt explicit. | The report is informational and does not guarantee accuracy or execute trades. Keep responsible-use language visible. |

## Prize positioning

- **Overall Prize:** lead with the complete working loop, Arbitrum settlement,
  security boundaries, and the path to agent-native paid APIs.
- **Promising Products:** lead with the narrow MVP, clear buyer, transparent
  unit price, and realistic roadmap from testnet evidence to user validation.
- **Milestone-based grants:** propose measurable milestones such as a public
  agent API, evaluation harness, multi-provider reliability, and initial paid
  usage rather than promising speculative token economics.

## Final claim controls

- Do not claim mainnet deployment, users, revenue, prediction accuracy, or
  production financial readiness without new evidence.
- Describe all current assets as testnet assets.
- State that the recorded self-funded demo transferred test USDC to the project
  recipient address; it proves protocol settlement, not customer revenue.
- Use `0xc896eb3b013a60deca7029dc2aa4f0da9a5faf82` as the only canonical
  `Signal402Registry` address. A second identical testnet deployment caused by
  a double click is documented in the deployment runbook and is not the
  project registry.

## Submission operations

- HackQuest shows the account as registered. Signal402 is 100/100 ready, but
  its public `Submitted Buildathons` list remains empty until the submission
  window opens and the final submission is completed.
- The published submission window is Sep 14, 2026 01:01 through Oct 4, 2026
  23:59 (times displayed by HackQuest while viewed in Asia/Shanghai).
- The project page reports 100/100 readiness. The existing Signal402 cover was
  uploaded to HackQuest and then verified on the public project page. The
  personal profile bio and pitch video are not part of this readiness
  calculation.
- Both uploaded videos are available from HackQuest, match the corresponding
  local file sizes, and resolve from the correct Demo and Pitch fields. A
  previous read during the tab-transition animation briefly observed the
  exiting video element and was not evidence of reversed fields.
- The event currently lists no individual workshop cards. Its official
  Workshops & Sessions tab directs participants to the Arbitrum Discord
  `#open-house` channel for workshop and feedback-session updates and strongly
  encourages attending feedback sessions.
