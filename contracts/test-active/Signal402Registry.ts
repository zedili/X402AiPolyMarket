import { expect } from "chai";
import { ethers } from "hardhat";

describe("Signal402Registry", function () {
  it("records a hash-only market insight attestation", async function () {
    const [requester] = await ethers.getSigners();
    const registry = await ethers.deployContract("Signal402Registry");

    const marketId = ethers.id("market-42");
    const contentHash = ethers.id("report-content");
    const transaction = await registry.attest(marketId, contentHash);
    const receipt = await transaction.wait();
    const event = receipt?.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "InsightAttested");

    expect(event).not.to.equal(undefined);
    const attestation = await registry.attestations(event!.args.attestationId);
    expect(attestation.marketId).to.equal(marketId);
    expect(attestation.contentHash).to.equal(contentHash);
    expect(attestation.requester).to.equal(requester.address);
  });

  it("rejects empty identifiers", async function () {
    const registry = await ethers.deployContract("Signal402Registry");
    await expect(registry.attest(ethers.ZeroHash, ethers.id("content"))).to.be
      .revertedWith("market id required");
  });
});
