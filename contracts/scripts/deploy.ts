import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer is configured. Set DEPLOYER_PRIVATE_KEY outside the repository.",
    );
  }

  const chain = await ethers.provider.getNetwork();
  const registry = await ethers.deployContract("Signal402Registry");
  await registry.waitForDeployment();
  const deploymentTransaction = registry.deploymentTransaction();
  const receipt = deploymentTransaction
    ? await deploymentTransaction.wait()
    : null;

  console.log(
    JSON.stringify(
      {
        contract: "Signal402Registry",
        address: await registry.getAddress(),
        deployer: deployer.address,
        network: network.name,
        chainId: chain.chainId.toString(),
        transactionHash: deploymentTransaction?.hash ?? null,
        gasUsed: receipt?.gasUsed.toString() ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
