import {ethers} from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners();


  console.log("Deploying contracts with the account:", deployer.address);

  //   在 Sepolia 没有官方 usdc 
  // 1、先部署 mockUsdc 合约
  const MockUsdc = await ethers.getContractFactory("Mock/MockUSDC");
  const mockUsdc = await MockUsdc.deploy();
  await mockUsdc.waitForDeployment();
  console.log("MockUsdc deployed to:", mockUsdc.target);

   //2、铸造 usdc 用于测试,usdc 重写了 decimals ，返回 6
   const initialUSDCSUppy = ethers.parseUnits("100000",6);  //  初始化10万 usdc，6位小数
   await mockUsdc.mint(deployer.address,initialUSDCSUppy); // mint 给 depoly 账户
   console.log("Deployer USDC balance:", await mockUsdc.balanceOf(deployer.address));

//    设置平台金库为部署者地址
   const PLFORM_TREASURY = deployer.address;
   
//    3、部署平台代币 insightToken
 const InsightToken = await ethers.getContractFactory("InsightToken");
 const insightToken = await InsightToken.deploy(
    PLFORM_TREASURY,
    "Insight Token",
    "INSIGHT"
 );  
 await insightToken.waitForDeployment();
 console.log("InsightToken deployed to:", await insightToken.getAddress());


//  4、部署平台奖励池合约
const RewardPool = await ethers.getContractFactory("RewardPool");
const rewardPool = await RewardPool.deploy(
  insightToken.target,
   mockUsdc.target,
  PLFORM_TREASURY
);
await rewardPool.waitForDeployment();
console.log("RewardPool deployed to:", await rewardPool.getAddress());

// 5、设置 insightToken 合约的 minter 角色
await insightToken.grantRole(
  await insightToken.MINTER_ROLE(),
  rewardPool.target
);
console.log("Minter role granted to RewardPool");

// 6、设置 rewardPool 合约的 distributor 角色
await rewardPool.grantRole(
  await rewardPool.DISTRIBUTOR_ROLE(),
  deployer.address
);


}

