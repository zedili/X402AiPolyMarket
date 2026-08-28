// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Signal402 insight attestation registry
/// @notice Stores content hashes only. Payments and report contents remain offchain.
contract Signal402Registry {
    struct Attestation {
        bytes32 marketId;
        bytes32 contentHash;
        address requester;
        uint64 createdAt;
    }

    mapping(bytes32 => Attestation) public attestations;

    event InsightAttested(
        bytes32 indexed attestationId,
        bytes32 indexed marketId,
        bytes32 indexed contentHash,
        address requester,
        uint64 createdAt
    );

    function attest(
        bytes32 marketId,
        bytes32 contentHash
    ) external returns (bytes32 attestationId) {
        require(marketId != bytes32(0), "market id required");
        require(contentHash != bytes32(0), "content hash required");

        attestationId = keccak256(
            abi.encode(marketId, contentHash, msg.sender, block.chainid, block.number)
        );
        require(attestations[attestationId].createdAt == 0, "already attested");

        uint64 createdAt = uint64(block.timestamp);
        attestations[attestationId] = Attestation({
            marketId: marketId,
            contentHash: contentHash,
            requester: msg.sender,
            createdAt: createdAt
        });

        emit InsightAttested(
            attestationId,
            marketId,
            contentHash,
            msg.sender,
            createdAt
        );
    }
}
