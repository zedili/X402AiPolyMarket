# Arbitrum Open House Singapore terms risk review

Reviewed against the official 14-page PDF titled **Open House Buildathon Terms
& Conditions**, last updated June 18, 2026:

https://openhouse.arbitrum.io/singapore_version_open_house_buildathon_terms___conditions.pdf

This is an operational summary, not legal advice. The official terms control.
Re-check the live PDF immediately before submission because the organizers may
amend it without prior notice.

## Safe operating dates

The official sources conflict:

| Source | Submission deadline | Winner announcement |
| --- | --- | --- |
| Terms PDF, page 1 | Oct 1, 2026, 11:59 PM SGT | Oct 4, 2026, 5:00 PM SGT |
| HackQuest schedule viewed in Asia/Shanghai | Oct 4, 2026, 11:59 PM | Oct 12, 2026, 2:00 PM |

Singapore and China Standard Time are both UTC+8. Operate to the earlier terms
deadline and target final submission by **Sep 30, 2026, 8:00 PM UTC+8**. Treat
the later HackQuest date only as a platform display until the organizers provide
written clarification.

## Eligibility

- Individuals and teams are allowed globally, subject to applicable US, UK,
  and EU sanctions and other legal restrictions.
- Participants must be at least 18 when registering.
- Organizer, sponsor, and judge personnel and their immediate family members
  are excluded.
- Solo participation is permitted. The reviewed terms contain no prohibition
  on AI development assistance, but ownership and originality representations
  still apply to the submission.
- Organizers retain broad discretion to verify eligibility, reject applicants,
  and disqualify submissions.

Before final submission, the owner must personally confirm age, sanctions,
employment/relationship exclusions, authority to submit all materials, and
acceptance of the official terms.

## Existing-project contradiction

The official materials are internally inconsistent:

- The event overview says builders may bring an existing project.
- Terms section 3.1 allows original work first created during the Buildathon or
  existing work adjusted during it, and defines the required adjustment as more
  than trivial development of the codebase.
- The attached Code of Conduct, page 13, says coding, design, and creative output
  must be produced exclusively during the official timeframe and that actual
  development or implementation must not begin before the Buildathon starts.

Signal402 existed before Sep 14, 2026, so relying on an implied interpretation
is an avoidable eligibility risk. Obtain written clarification from the
organizers. Regardless of the reply, preserve the pre-event Git baseline and
ship a clearly substantive new feature during the official Buildathon window.

Recommended in-window scope:

1. Publish an agent-native report API and stable receipt schema.
2. Add an evaluation harness covering report schema validity, latency, provider
   failure, and settlement cancellation.
3. Document the baseline commit, in-window commits, deployed result, tests, and
   judge-visible before/after evidence.

Do not begin implementation before Sep 14. Planning, research, and wireframing
are expressly described as permitted preparatory activities.

## Qualification and judging

- A submission must be functional, demonstrable, documented, and deployed on
  Arbitrum Sepolia, Arbitrum One, or a custom Arbitrum chain.
- The terms list innovation, technical implementation, use of Arbitrum,
  potential impact, presentation quality, and novelty as judging factors.
- The public HackQuest page additionally emphasizes smart-contract quality,
  product-market fit, innovation/creativity, and real problem solving.
- At least one of each three-prize set is reserved for Robinhood Chain and at
  least one for Arbitrum.

Signal402 already satisfies the network qualification through verified
Arbitrum Sepolia settlement and a verified registry deployment. The in-window
feature should strengthen technical implementation, potential impact, and
novelty without changing the honest testnet-only posture.

## Prize obligations

For prize categories other than the Best Promising Products track, the terms
describe milestone-based payment:

- 25% after winning and executing a grant agreement.
- 25% after a one-month Foundation check-in, with the project building
  exclusively on an Arbitrum chain.
- 50% after a successful Arbitrum-chain mainnet launch and mutually agreed KPIs.

Other material conditions include:

- USDC payment on Arbitrum One to the registered wallet.
- Possible compliance and AML checks before payment.
- A required grant agreement; refusal may forfeit the prize.
- Winner responsibility for taxes and fees.
- Organizer discretion to modify, replace, or cancel prizes.

Do not promise an exclusive Arbitrum roadmap or a mainnet launch until the owner
has reviewed the eventual grant agreement and agreed to its milestones.

## IP, publicity, data, and confidentiality

- Participants retain ownership of their submission IP.
- Participants grant organizers, service providers, affiliates, and sponsors a
  worldwide, royalty-free, non-exclusive license to use, display, and promote
  the submission for Buildathon-related marketing, publicity, and education.
- The terms permit use of participant name, likeness, image, voice, and
  biographical information for promotional, educational, and documentary use
  without additional compensation.
- Submission details may be published, and contact details may be shared with
  sponsors, service providers, program partners, and advertising partners.
- Confidential information supplied by organizers is subject to use,
  non-disclosure, return/destruction, and three-year survival obligations.
- Participants warrant originality, non-infringement, and lawful content.

The owner must explicitly accept these terms before final submission. Do not
upload private, licensed, or third-party material unless its use rights are
documented.

## Organizer clarification draft

**To:** engineering@arbitrum.foundation

**Subject:** Clarification on existing projects and official deadline — Open
House Singapore Buildathon

Hello Arbitrum Open House team,

I am registered as a solo builder for the Singapore Online Buildathon and am
preparing an existing Arbitrum Sepolia project for the event. Could you please
clarify two points in the official materials?

1. The event overview and section 3.1 of the Terms allow an existing project if
   it receives more-than-trivial development during the Buildathon. The attached
   Code of Conduct says coding, design, and creative output must be produced
   exclusively during the official timeframe. Is an existing project eligible
   if I disclose the pre-event baseline and ship substantial new functionality
   between Sep 14 and the official deadline?
2. The Terms PDF lists Oct 1, 2026, 11:59 PM SGT as the submission deadline,
   while HackQuest currently displays Oct 4, 2026, 11:59 PM. Which deadline
   controls?

For completeness, I am a solo human founder using AI development agents for
engineering and documentation assistance while retaining ownership and final
decision-making. Please also confirm that this disclosed use is permitted.

Thank you.

