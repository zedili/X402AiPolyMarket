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
    await expect(registry.attest(ethers.id("market"), ethers.ZeroHash)).to.be
      .revertedWith("content hash required");
  });

  it("keeps attestations from different requesters distinct", async function () {
    const [firstRequester, secondRequester] = await ethers.getSigners();
    const registry = await ethers.deployContract("Signal402Registry");
    const marketId = ethers.id("market-42");
    const contentHash = ethers.id("report-content");

    const firstReceipt = await (
      await registry.connect(firstRequester).attest(marketId, contentHash)
    ).wait();
    const secondReceipt = await (
      await registry.connect(secondRequester).attest(marketId, contentHash)
    ).wait();
    const firstEvent = firstReceipt?.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "InsightAttested");
    const secondEvent = secondReceipt?.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "InsightAttested");

    expect(firstEvent!.args.attestationId).not.to.equal(
      secondEvent!.args.attestationId,
    );
    expect(firstEvent!.args.requester).to.equal(firstRequester.address);
    expect(secondEvent!.args.requester).to.equal(secondRequester.address);
  });
});
