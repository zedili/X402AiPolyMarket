# Signal402 contracts

The active contract is `src/Signal402Registry.sol`. It provides an optional,
permissionless way for a report requester to attest a market identifier and a
report-content hash. It stores no report text, payment data, API key, or wallet
secret. The x402 payment gate remains in the Next.js server.

Legacy token-economics experiments under `contracts/` are excluded by the
Hardhat source configuration and are not part of the Buildathon product.

## Verify locally

```bash
npm ci
npm test
npm run deploy:local
```

The test suite covers event and storage integrity, empty identifier rejection,
and distinct requester provenance. The local deployment command exercises the
same deployment script used for Arbitrum Sepolia.

## Deploy to Arbitrum Sepolia

For an owner-wallet deployment, use the
[official Arbitrum Remix workflow](https://docs.arbitrum.io/build-decentralized-apps/quickstart-solidity-remix):
compile `src/Signal402Registry.sol` with Solidity 0.8.28, select the browser
wallet provider, verify chain ID `421614`, and review the deployment transaction
in the wallet. Do not import, export, or paste the owner's private key.

The complete project-specific safety and verification sequence is in the
[deployment runbook](../docs/registry-deployment-runbook.md).

For automated operator deployments, provide credentials only through your
local shell or a secret manager. Never commit a private key or paste it into
project documentation.

```bash
export ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
export DEPLOYER_PRIVATE_KEY=<local-secret>
npm run deploy:arbitrum-sepolia
```

In PowerShell, use `$env:ARBITRUM_SEPOLIA_RPC_URL=...` and
`$env:DEPLOYER_PRIVATE_KEY=...` instead. Keep the shell history and workstation
security implications in mind when choosing how to inject the secret.

The deployment script prints the contract address, deployer, network, and chain
ID. Record the resulting Arbiscan address in the root README and submission
materials before presenting the registry as deployed.
