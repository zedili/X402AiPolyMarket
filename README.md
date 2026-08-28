# Signal402

Signal402 is a non-custodial market-intelligence layer for people and autonomous agents. It is being rebuilt for the Arbitrum Open House Singapore Buildathon from the original X402AiPolyMarket prototype.

The target flow is simple:

1. Read live public prediction-market probabilities for free.
2. Request a deeper AI report with evidence, counterarguments, risks, and an independent probability estimate.
3. Unlock that report with a per-request x402 USDC payment on Arbitrum.

Signal402 does not custody user funds or place trades.

Live production app: https://signal402.vercel.app

## What works now

- Live market snapshots from Polymarket's public Gamma API, normalized by server-side Next.js routes.
- Structured DeepSeek reports that separate market probability, independent estimate, evidence, counterarguments, risks, and assumptions.
- A real x402 v2 payment gate for `POST /api/analysis` on Arbitrum Sepolia.
- Browser-wallet EIP-3009 authorization through the official x402 TypeScript SDK.
- Testnet USDC settlement through the PayAI facilitator, with no custody and no facilitator private key in this repository.
- Arbiscan transaction receipts shown after successful settlement.
- A minimal Solidity registry for optional hash-only insight attestations, with Hardhat tests.
- A Go API retained from the original prototype; its unfinished legacy verifier fails closed.
- A permanent Vercel production deployment whose live-data pages and x402 `402 Payment Required` response have been verified.

The old Solana mock-payment page and permissive mock verifier were removed. They are not part of Signal402's active architecture.

## Payment configuration

The current Buildathon demo charges `0.01 USDC` per successful AI report on Arbitrum Sepolia:

| Setting | Value |
| --- | --- |
| Protocol | x402 v2, `exact` scheme |
| Network | `eip155:421614` |
| Asset | Circle testnet USDC (`0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`) |
| Recipient | `0x0573f139d21fb3140155567Cba7630d3948F4ea3` |
| Facilitator | `https://facilitator.payai.network` |

The route first verifies the signed authorization, runs the AI handler, and settles only when the handler returns a successful response. A model or provider failure is not settled.

## Local development

### Frontend

```bash
cd front-end
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

Set `DEEPSEEK_API_KEY` in `front-end/.env.local` to enable AI requests. Never commit that file.

`X402_FACILITATOR_URL` is optional and defaults to PayAI. A replacement facilitator must advertise x402 v2 support for `eip155:421614` from its `/supported` endpoint.

Checks:

```bash
pnpm audit --prod --audit-level high
pnpm test
pnpm check
pnpm build
```

GitHub Actions repeats the frontend, contract, and Go checks on every push to
`main` and on every pull request.

### Go API

```bash
cd back-end/PolyMarket
go test ./...
go run polymarket.go -f etc/polymarket-api.yaml
```

### Contracts

```bash
cd contracts
npm ci
npm test
```

Hardhat compiles `contracts/src`. The unfinished token-economics contracts under `contracts/contracts` are legacy experiments and are intentionally excluded from the active build.

## Repository layout

```text
front-end/                 Next.js application, live-data routes, AI, and x402 gate
back-end/PolyMarket/       Go API
contracts/src/             Active Solidity contracts
contracts/test-active/     Active Hardhat tests
contracts/contracts/       Legacy contract experiments
```

## Security notes

- All AI secrets must remain server-side.
- The payment gate fails closed unless the official SDK and configured facilitator verify the authorization.
- Never add a client-side AI provider key or a wallet private key to this repository.
- The facilitator is an external dependency; production deployment should monitor it and document the trust boundary.
- Only hashes, not private report contents, are intended for optional onchain attestation.

## Buildathon materials

- [Narrated product demo](docs/media/Signal402-Demo-Video.mp4)
- [Narrated judge pitch](docs/media/Signal402-Pitch-Video.mp4)
- [Pitch deck](Signal402-Arbitrum-Open-House-Pitch.pptx)
- [Three-minute demo script](docs/demo-script.md)
- [Submission copy](docs/submission-copy.md)

## References

- [x402 documentation](https://docs.x402.org/)
- [Arbitrum documentation](https://docs.arbitrum.io/)
- [Polymarket developer documentation](https://docs.polymarket.com/)
