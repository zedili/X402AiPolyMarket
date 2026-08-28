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
- Remaining enhancement: deploy the project's hash-only
  `Signal402Registry` contract to Arbitrum Sepolia after explicit wallet and
  test-gas approval, then record the address here.

## Published judging criteria

| Criterion | Current evidence | Honest limitation / next proof |
| --- | --- | --- |
| Smart contract quality | `Signal402Registry` is minimal, permissionless, stores hashes rather than reports or funds, has three active Hardhat tests, and deploys successfully on a local chain. The production payment path uses official x402 packages and settles only after a valid AI result. | The registry does not yet have a public Arbitrum Sepolia address and is not required for the core payment path. Deploy and verify it before claiming it as live. |
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
- Do not call `Signal402Registry` deployed until an Arbiscan contract address is
  recorded and independently readable.
