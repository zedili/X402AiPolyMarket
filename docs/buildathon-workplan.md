# Signal402 in-window Buildathon workplan

This is a pre-event planning document only. Do not begin implementation before
the official Buildathon starts on Sep 14, 2026. Record the final pre-event Git
commit as the baseline, then keep all qualifying implementation commits inside
the official window.

## Objective

Turn the existing human-facing paid report flow into a verifiable,
agent-consumable insight protocol that produces a stable response envelope,
payment evidence, deterministic content hashes, and optional onchain
attestation on Arbitrum Sepolia.

This scope is more than a cosmetic or documentation-only change. It connects
the existing x402 payment boundary to the deployed `Signal402Registry`, adds a
machine client, and creates measurable reliability evidence.

## Deliverables

### 1. Versioned agent API

- Add a documented versioned endpoint for purchasing a report by market ID.
- Return the standard x402 v2 payment requirement to an unpaid client.
- Preserve the existing rule that provider or schema failure cancels settlement.
- Return a versioned JSON envelope containing the source snapshot, structured
  analysis, generation metadata, payment receipt, and hash fields.
- Keep AI credentials and market refresh server-side.

### 2. Deterministic proof bundle

- Define canonical JSON serialization for the report and source snapshot.
- Compute and return `marketIdHash`, `contentHash`, and an `attestationId` input
  preview without exposing private report data onchain.
- Show the canonical registry address and network in the response and UI.
- Add a wallet-controlled, explicitly optional action that calls
  `Signal402Registry.attest(marketIdHash, contentHash)` on Arbitrum Sepolia.
- Display and link both the x402 settlement receipt and registry transaction.

### 3. Agent reference client

- Add a minimal command-line example using the official x402 client packages.
- Demonstrate the initial 402 response, wallet authorization, paid retry,
  structured response validation, and receipt extraction.
- Default to testnet and require the operator to supply its own signer securely.
- Never include or generate a funded private key in the repository.

### 4. Evaluation harness

- Measure schema-valid response rate, latency, and provider error behavior over
  a bounded test fixture set.
- Prove settlement is not called when market refresh, provider output, parsing,
  or schema validation fails.
- Verify canonical hashes are stable across key-order differences and change
  when report content changes.
- Cover the registry call data and emitted attestation event.
- Publish only test fixtures and aggregate results; never publish secrets.

### 5. Judge-facing evidence

- Add a before/after architecture diagram and short changelog tied to commits.
- Record one clean agent-client purchase and one optional registry attestation.
- Update the demo to show the machine-readable 402 boundary, structured report,
  settlement receipt, deterministic hash, and registry proof.
- Update the submission's Progress During Hackathon field with only work landed
  after the recorded baseline.

### 6. Provenance-clean visual refresh

- Replace the inherited hero background and AI/crypto/stocks/tech icon set
  during the official event window.
- Use newly created assets with recorded prompts or source files, date,
  author/tool, input rights, and SHA-256 hashes.
- Update the application, cover, deck, and videos consistently where those
  visuals appear.
- Preserve the old files only in the pre-event Git baseline; do not reuse them
  in the final submitted build unless their rights are separately documented.

## Acceptance gates

- All new implementation commits have timestamps inside the official window.
- Frontend tests, type checks, production build, contract tests, Go tests, and
  repository secret scanning pass from a clean checkout.
- A fresh production smoke test returns live market data and a valid unpaid 402.
- At least one new paid agent-client request settles on Arbitrum Sepolia.
- At least one optional report hash is attested through the canonical registry.
- Every public claim has a URL, transaction, test, or reproducible command as
  evidence.
- The project remains explicitly testnet-only and information-only.

## Suggested sequence

1. **Sep 14:** tag or record the pre-event baseline, re-check terms, and confirm
   the submission portal is open.
2. **Sep 14–18:** implement the versioned API and canonical proof bundle.
3. **Sep 19–22:** integrate optional registry attestation and the reference
   client.
4. **Sep 23–25:** implement the evaluation harness and failure-path coverage.
5. **Sep 23–25:** create and integrate the provenance-clean visual refresh.
6. **Sep 26–27:** deploy, run testnet proof transactions, and collect evidence.
7. **Sep 28–29:** update videos, submission copy, and judge Q&A.
8. **Sep 30 by 8:00 PM UTC+8:** complete the final owner-confirmed submission,
   ahead of the earlier Oct 1 terms deadline.

## Scope controls

- Do not migrate to Robinhood Chain without an explicit owner decision; the
  existing Arbitrum deployment already qualifies for the reserved Arbitrum
  position, and a rushed second-chain deployment would dilute proof quality.
- Do not add trading, custody, token economics, or mainnet claims.
- Do not require registry attestation for report purchase; it remains an
  optional proof layer.
- Prefer one complete, measurable agent workflow over additional UI breadth.
