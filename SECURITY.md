# Security Policy

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository. Do not
open a public issue containing credentials, wallet secrets, or an unpatched
exploit.

## Secret handling

- Keep API keys and wallet private keys in local or deployment environment
  variables. Never commit them to Git.
- Treat any credential that reaches Git history as compromised, even after the
  source file is fixed. Revoke it at the provider, create a replacement, and
  review provider logs before closing the alert as revoked.
- Use `front-end/.env.example` only as a list of variable names. It must never
  contain real values.
- Run `pnpm security:secrets` from `front-end/` before pushing. CI runs the same
  check for every push and pull request.

## Wallet safety

Signal402 never asks for a wallet seed phrase or private key. Browser payments
use a wallet-provided EIP-712 signature and are settled through the configured
x402 facilitator. Verify the network, token, recipient, and amount in the wallet
before signing.
