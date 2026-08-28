# Signal402 — 3-minute demo script

## 0:00–0:25 — The problem

“Prediction markets make the crowd probability public, but useful analysis is still bundled behind subscriptions, accounts, or opaque APIs. Signal402 makes one structured report purchasable as one explicit transaction—for a person or an autonomous agent.”

Show the homepage and say: “This is not a trading bot. Signal402 never holds funds and never places a trade.”

## 0:25–0:55 — Live market data

Open **Markets**. Search or select a visible event.

“These cards are populated from Polymarket’s public Gamma API through server-side normalized routes. The product is using live market snapshots, not hard-coded demo fixtures.”

## 0:55–1:25 — The product loop

Open a market detail page and select **AI Analysis**.

“The user inspects the market for free. A structured report costs exactly 0.01 USDC on Arbitrum Sepolia. The wallet sees the amount and network before signing.”

Point to the wallet/payment UI. Use the already verified receipt as the default proof; only repeat a live payment if the test wallet and authorization have been approved.

## 1:25–2:10 — The x402 boundary

“The protected endpoint first returns an x402 payment requirement. The browser wallet creates an EIP-3009 authorization, and the server verifies it through the facilitator. Only then does the server fetch a fresh market snapshot and ask the AI provider for strict JSON.”

“Most importantly, settlement happens only after a valid report exists. If the model provider fails, the request fails closed and payment is not settled.”

## 2:10–2:35 — What the report contains

Show the report structure or the locked preview:

- market probability;
- independent estimate;
- evidence and counterarguments;
- risks and assumptions;
- a payment receipt after success.

“We sell a bounded information response, not a promise of accuracy and not a trade.”

## 2:35–3:00 — Proof and close

“The current build has live Polymarket data, an x402 v2 gate on `eip155:421614`, a 0.01 USDC price, protocol and contract tests, and green CI across contracts, backend, and frontend.”

“The permanent deployment is live, and an end-to-end testnet payment has settled successfully. Next is multi-provider evaluation and an agent-native API. Signal402 makes market intelligence composable: pay per insight, not per subscription.”

## 60-second fallback

“Signal402 sells one structured prediction-market report for one explicit x402 payment. Browse live Polymarket markets for free, select AI Analysis, and a wallet sees a 0.01 USDC request on Arbitrum Sepolia. The server verifies payment, generates strict structured analysis, and settles only after success. It is non-custodial and never places trades. The working build has live data, a valid 402 gate, protocol tests, contract tests, and green CI. Signal402 turns market intelligence into a composable API good for both people and autonomous agents.”

## Demo safety checklist

- Use only Arbitrum Sepolia and test USDC.
- Never reveal seed phrases, private keys, API keys, or wallet recovery screens.
- Pre-open the exact market page and keep the deck as a fallback if network access fails.
- Do not claim guaranteed returns, prediction accuracy, revenue, users, or mainnet readiness.
