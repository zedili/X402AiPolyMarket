# HackQuest final submission field map

This map is based on the current Signal402 project setup page, HackQuest's
official participant submission guides, and the Singapore event requirements.
The exact final form may change when the submission window opens, so re-read
every field before entering or submitting data.

## Submission flow

1. Open **My Buildathon** and select the registered Singapore event.
2. Choose **Start Submission**.
3. Select the existing 100/100-ready Signal402 project.
4. Complete event-specific fields and deployment details.
5. Review all public claims and confidential judge-only information.
6. Obtain owner confirmation immediately before accepting terms or clicking the
   final submit button.
7. Save the success message, submitted-project URL, submission identifier if
   present, and a timestamped screenshot.
8. Re-open the submitted project from My Buildathon and verify that it appears
   in the Singapore Project Gallery.

HackQuest documentation says submitted projects may normally be edited before
the deadline, but do not rely on that as a recovery strategy.

## Field values already prepared

| Likely field | Prepared value or source | Status |
| --- | --- | --- |
| Project name | `Signal402` | Ready |
| One-line intro | `Signal402 lets people and autonomous agents purchase one structured prediction-market report with one non-custodial x402 USDC payment on Arbitrum.` | Ready |
| MVP / live demo | https://signal402.vercel.app | Ready |
| Repository | https://github.com/zedili/X402AiPolyMarket | Ready; public push pending owner approval |
| Demo video | HackQuest Demo Video field and repository copy | Ready; update after in-window work |
| Pitch video | HackQuest Pitch Video field and repository copy | Ready; update after in-window work |
| Description | `docs/submission-copy.md` | Ready; refresh after in-window work |
| Progress During Hackathon | Post-baseline changelog only | Pending official window |
| Team | Solo founder and full-stack builder, supported by AI development agents | Ready |
| Team role | Founder / Full-stack builder | Ready |
| Wallet | `0x0573f139d21fb3140155567Cba7630d3948F4ea3` | Connected; re-check ownership and network |
| Ecosystem deployed | Arbitrum | Ready |
| Deployment environment | Testnet / Arbitrum Sepolia | Ready |
| Registry address | `0xc896eb3b013a60deca7029dc2aa4f0da9a5faf82` | Ready |
| Registry link | https://sepolia.arbiscan.io/address/0xc896eb3b013a60deca7029dc2aa4f0da9a5faf82 | Ready |
| Settlement proof | https://sepolia.arbiscan.io/tx/0x4c0e782d706b544bb154116457eb8c3d447fe86a1b6e82ca4f94043221cdadf2 | Ready; add an in-window receipt |
| Fundraising status | Bootstrapped; not currently fundraising | Ready |
| Product sectors | AI, Infra, DeFi | Ready |
| Tech stack | React, Next.js, TypeScript, Node, Solidity, Web3, Ethers, Go, x402 | Ready |

## Event-specific fields to resolve

### Location

HackQuest guides show a participant location field in some final submission
forms. Do not infer or publish the owner's city or country. Ask for the exact
public location value if the Singapore form requires it.

### Prize track

The event lists Overall Prize, Best/Promising Products, and discretionary
grants. If multiple selection is allowed, select every honest eligible track.
If only one track is allowed, ask the owner to choose after comparing the final
form wording and milestone obligations. The Promising Products track appears to
be exempt from the staged 25%/25%/50% prize conditions described for other
categories, which may materially affect the choice.

Do not select a Robinhood Chain track or claim a Robinhood deployment unless a
real, tested deployment is completed and the owner has approved that strategy.

### Terms and eligibility declarations

Immediately before submission, obtain explicit owner confirmation of:

- age 18 or older;
- no sanctions or legal restriction preventing participation;
- no excluded relationship with organizers, sponsors, or judges;
- authority and rights to submit all code, media, and third-party assets;
- acceptance of the official IP, publicity, data-sharing, confidentiality,
  dispute, compliance, tax, and prize/grant conditions;
- the accuracy of the connected payout wallet;
- the final public submission text and AI-assistance disclosure.

### Confidential deployment details

HackQuest marks deployment details as judge-only. Enter only the ecosystem,
testnet/mainnet status, canonical address, and explorer link. Never put a private
key, seed phrase, API key, RPC credential, wallet recovery detail, or production
secret into the form.

## Final verification evidence

Save all of the following under a timestamped local evidence directory:

- screenshot of the reviewed final form before submission;
- screenshot of the successful submission message;
- submitted project URL and any submission ID;
- Project Gallery listing;
- exact Git commit and public pre-event tag;
- production deployment URL and deployment identifier;
- in-window x402 settlement and registry attestation receipts;
- final copies or hashes of the demo and pitch videos;
- organizer clarification on deadline and existing-project eligibility.

