const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting HushVote FHE deployment to Sepolia...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy FHEBallot only (FHEQuadraticVoting can be deployed later)
  console.log("📦 Deploying FHEBallot with FHE support...");
  const FHEBallot = await ethers.getContractFactory("FHEBallot");
  
  // Deploy with higher gas limit
  const fheBallot = await FHEBallot.deploy({
    gasLimit: 8000000,
    gasPrice: ethers.parseUnits("30", "gwei") // Higher gas price for faster inclusion
  });
  
  console.log("⏳ Waiting for deployment confirmation...");
  await fheBallot.waitForDeployment();
  const ballotAddress = await fheBallot.getAddress();
  console.log("✅ FHEBallot deployed to:", ballotAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      FHEBallot: ballotAddress
    },
    note: "FHE-enabled voting contract deployed to Sepolia (using @fhevm/solidity 0.8.0)"
  };

  const fs = require("fs");
  const deploymentPath = "./deployments";
  
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath);
  }
  
  const filename = `${deploymentPath}/sepolia-fhe-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("📄 Deployment info saved to:", filename);
  console.log("\n📋 Contract Address:", ballotAddress);
  console.log("\n🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + ballotAddress);
  
  // Verify contract on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: ballotAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("You can verify manually using:");
      console.log(`npx hardhat verify --network sepolia ${ballotAddress}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });