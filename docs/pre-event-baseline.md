# Signal402 pre-event baseline

This document separates work that already existed before the Arbitrum Open
House Singapore Buildathon from qualifying implementation completed during the
official event window. Never describe a pre-event item as “built during the
Buildathon.”

## Immutable local reference

- Tag: `arbitrum-singapore-pre-event-2026-08-31`
- Commit: `ea31aae7d177644c8a42dcceddde133df5e16a0d`
- Tree: `62961668af0d33306645057e08baa8066ec07eb4`
- Recorded: Aug 31, 2026, before the Sep 14 official start
- Public tag status: local only until the owner approves a public Git push

The baseline tag points to the complete repository state, including product
code, tests, videos, judging material, and the terms/workplan review available
at the time it was created.

## Key artifact blob IDs

These Git object IDs make later before/after comparisons unambiguous:

| Artifact | Baseline Git blob |
| --- | --- |
| x402 server flow | `a049db7fd32a5e1998a07161d29529c54298ffa1` |
| Paid analysis route | `477af9194305b3534a66e153f76f43cf95a7f1e2` |
| `Signal402Registry.sol` | `606ca60b84870746f76179034ba0dedc9668944c` |
| Demo video | `d19d171e5ada7bf0c96957106c171110d831b37d` |
| Pitch video | `45de8275bf984c5f08014e4aadac737a851703b6` |

## Features that are explicitly pre-event

- Live Polymarket market lists and detail views.
- The human-facing structured DeepSeek report.
- The x402 v2 `POST /api/analysis` payment gate.
- Browser-wallet EIP-3009 test-USDC authorization.
- Fail-closed behavior that avoids settlement after provider failure.
- The deployed production app at https://signal402.vercel.app.
- Two successful Arbitrum Sepolia x402 settlement receipts.
- The deployed and Sourcify-verified `Signal402Registry` contract.
- Existing frontend, protocol, contract, and Go tests.
- Existing HackQuest project copy, cover, demo video, pitch video, and 100/100
  project readiness.

These assets prove that the starting project is real and functional. They are
not the evidence for more-than-trivial in-window development.

## Pre-event public deployment state

At baseline creation, `origin/main` was
`ab6e455e835396e4f88798a95ca259818cf3710d`. The local branch contained four
additional commits awaiting explicit owner approval for public push. Those
commits contain a clean-build fix and event-preparation documentation, not the
planned in-window feature.

## In-window evidence rules

After Sep 14, 2026:

1. Start all implementation from this baseline tag.
2. Keep qualifying code, test, deployment, and evidence commits inside the
   official window.
3. Maintain `docs/progress-during-buildathon.md` as a commit-linked changelog.
4. Record production deployment identifiers and transaction receipts.
5. Compare changed source and behavior against this tag.
6. Update HackQuest's Progress During Hackathon field with only the verified
   post-baseline work.

The final submission should link this baseline and the post-event head so a
judge can independently inspect the substantive difference.

