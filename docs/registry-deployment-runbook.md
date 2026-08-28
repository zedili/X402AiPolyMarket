# Signal402Registry Arbitrum Sepolia deployment runbook

This runbook is for the optional Buildathon deployment of
`contracts/src/Signal402Registry.sol`. It deliberately keeps the owner wallet's
private key inside the browser wallet and separates preparation from the two
owner-authorized external actions: claiming test ETH and signing deployment.

Official reference: [Arbitrum Solidity + Remix quickstart](https://docs.arbitrum.io/build-decentralized-apps/quickstart-solidity-remix).

## Immutable preflight facts

- Contract: `Signal402Registry`
- Compiler: Solidity `0.8.28`
- Network: Arbitrum Sepolia
- Chain ID: `421614`
- RPC: `https://sepolia-rollup.arbitrum.io/rpc`
- Explorer: `https://sepolia.arbiscan.io`
- Intended deployer: `0x0573f139d21fb3140155567Cba7630d3948F4ea3`
- Source SHA-256: `5ce7e70c57f8f5d48e162bad3ccde9e4154e92a513923b9ddb635d458e032559`
- Local init code size: `1815` bytes
- Local runtime code size: `1784` bytes
- Last measured local deployment gas: `436911`

Recompute the source hash immediately before deployment and stop if it differs.
Run `npm test` and `npm run deploy:local` from `contracts/`; both must pass.

## Completed deployment record

The owner-approved deployment was completed on Arbitrum Sepolia on
2026-08-28. Use only the nonce-0 deployment as the canonical project registry.

- Canonical contract: `0xc896eb3b013a60deca7029dc2aa4f0da9a5faf82`
- Canonical transaction: `0x5af65b36f980448d63127b73120c6ab40a7b64a7a81cfa977bd8e710765d61f4`
- Block: `302861436`
- Deployer: `0x0573f139d21fb3140155567cba7630d3948f4ea3`
- Transaction nonce: `0`
- Value: `0 wei`
- Gas limit: `1000000`
- Gas used: `482155`
- Runtime code size: `1730` bytes
- Runtime code hash: `0x5c14c6ef1925a462bbc828c8a8613c269aad8bd50387ba364181390f5e0f6a7b`
- Sourcify match: `exact_match` for creation and runtime bytecode
- Sourcify match ID: `46847913`
- Sourcify record: https://repo.sourcify.dev/421614/0xc896eB3B013a60deCA7029dc2aa4F0da9a5faf82

The Remix deploy button was clicked twice after increasing the gas limit. The
second transaction also succeeded and produced an identical runtime bytecode,
but it is an accidental duplicate and must not be presented as the project
registry:

- Duplicate contract: `0x40d1f09d9537862c5174ee1342b7e4c7d811b9a5`
- Duplicate transaction: `0xcb484ffc34917808b48c9a0c14e50a7cfd3edd694f6807b0fbe19ba2112e079f`
- Transaction nonce: `1`

Independent RPC verification confirmed both receipts succeeded, both
transactions were zero-value contract creations by the intended deployer, and
the two runtime bytecodes are identical. An `eth_call` against the canonical
contract rejected an empty market ID with `market id required`; a valid call
simulation returned an attestation ID. Sourcify then independently recompiled
the submitted standard JSON input and reported exact matches for both creation
and runtime bytecode. Its attempt to forward the verification to Etherscan/
Arbiscan hit that service's daily 500-submission limit, so the project must not
claim an Arbiscan source-code verification until that separate explorer status
is confirmed.

## Owner approval boundary

Do not perform either action without explicit owner approval:

1. Claim Arbitrum Sepolia test ETH to the intended deployer wallet.
2. Approve the contract-creation transaction in the browser wallet.

Testnet ETH has no intended monetary value, but the wallet address, network,
transaction data, and gas estimate must still be checked before approval.

## Funding

The wallet currently needs native Arbitrum Sepolia ETH for deployment gas. Use
an established faucet listed by ethereum.org, such as the Chainlink Arbitrum
Sepolia faucet. Confirm that the destination is the intended deployer and that
the selected asset is native ETH on Arbitrum Sepolia—not mainnet ETH and not a
different test network.

After the faucet completes, independently query `eth_getBalance` through the
official RPC and wait for a non-zero balance before opening the deployment
transaction.

## Compile and deploy without exposing a private key

1. Open `https://remix.ethereum.org` directly and create a blank workspace.
2. Create `Signal402Registry.sol` and copy only the reviewed repository source.
3. Select compiler `0.8.28`; keep optimizer settings consistent with the
   Hardhat build (optimizer disabled unless the repository is changed and
   retested).
4. Compile and confirm there are no warnings that affect correctness.
5. In Deploy & Run Transactions, select the injected/browser-wallet provider.
6. In the wallet, verify the account is the intended deployer and the network
   is Arbitrum Sepolia (`421614`).
7. Select `Signal402Registry`; it has no constructor arguments and requires no
   ETH value.
8. Request deployment. In the wallet, verify it is a contract-creation
   transaction, value is zero, and the gas asset is testnet ETH.
9. The owner reviews and approves the wallet prompt.

Never paste a seed phrase or private key into Remix, chat, a terminal, or a
website. Never switch to Arbitrum One for this Buildathon test deployment.

## Independent post-deployment verification

Record the transaction hash and contract address, then verify all of the
following before updating public claims:

- receipt status is successful;
- receipt chain is `421614`;
- transaction sender is the intended deployer;
- transaction recipient is empty/null (contract creation);
- deployed address has non-empty runtime bytecode via `eth_getCode`;
- `attest(bytes32,bytes32)` rejects an empty market or content hash in a local
  call simulation;
- the Arbiscan address page resolves publicly.

Source-code verification on Arbiscan is desirable but separate from proving
that bytecode is deployed. If verification tooling or API access is unavailable,
record that limitation rather than claiming the source is verified.

## Publication checklist

After independent verification:

1. Add the Arbiscan contract address and deployment transaction to the root
   README, submission copy, judging matrix, and final-submission checklist.
2. Update the HackQuest progress description with the address.
3. Run the secret scan, contract tests, frontend checks, and CI.
4. Recheck the production app and public HackQuest project page.
