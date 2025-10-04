const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting HushVote deployment to Sepolia...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy FHEVotingBase (if it's deployable, otherwise skip)
  console.log("📦 Deploying FHEVotingBase...");
  // Note: FHEVotingBase is abstract, so we skip it
  
  // Deploy FHEBallot
  console.log("📦 Deploying FHEBallot...");
  const FHEBallot = await ethers.getContractFactory("FHEBallot");
  
  // For Sepolia deployment, we need to handle FHE initialization differently
  // Since Sepolia doesn't have native FHE support, we'll deploy with mock encrypted constants
  const mockCtZero = ethers.hexlify(ethers.randomBytes(32));
  const mockCtOne = ethers.hexlify(ethers.randomBytes(32));
  
  const fheBallot = await FHEBallot.deploy();
  await fheBallot.waitForDeployment();
  const ballotAddress = await fheBallot.getAddress();
  console.log("✅ FHEBallot deployed to:", ballotAddress);

  // Deploy FHEQuadraticVoting
  console.log("\n📦 Deploying FHEQuadraticVoting...");
  const FHEQuadraticVoting = await ethers.getContractFactory("FHEQuadraticVoting");
  const quadraticVoting = await FHEQuadraticVoting.deploy();
  await quadraticVoting.waitForDeployment();
  const quadraticAddress = await quadraticVoting.getAddress();
  console.log("✅ FHEQuadraticVoting deployed to:", quadraticAddress);

  // Create sample votings for testing
  console.log("\n📝 Creating sample votings...");
  
  try {
    // Create a simple yes/no vote
    console.log("Creating 'Community Proposal #1' voting...");
    const tx1 = await fheBallot.createVoting(
      "Community Proposal #1",
      ["Yes", "No", "Abstain"],
      Math.floor(Date.now() / 1000) + 60, // Start in 1 minute
      Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // End in 7 days
      100, // Quorum: 100 votes
      1 // Single choice voting
    );
    await tx1.wait();
    console.log("✅ Sample voting created");

    // Create a quadratic voting
    console.log("Creating 'Budget Allocation' quadratic voting...");
    const tx2 = await quadraticVoting.createVoting(
      "Budget Allocation",
      ["Development", "Marketing", "Operations", "Research"],
      Math.floor(Date.now() / 1000) + 60,
      Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // End in 14 days
      50, // Quorum: 50 voters
      100 // 100 credits per voter
    );
    await tx2.wait();
    console.log("✅ Quadratic voting created");
  } catch (error) {
    console.log("⚠️  Could not create sample votings (this is normal for Sepolia):", error.message);
  }

  // Save deployment addresses
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      FHEBallot: ballotAddress,
      FHEQuadraticVoting: quadraticAddress
    },
    note: "This deployment uses mock FHE values for Sepolia. For full FHE functionality, deploy to Zama Devnet."
  };

  const fs = require("fs");
  const deploymentPath = "./deployments";
  
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath);
  }
  
  fs.writeFileSync(
    `${deploymentPath}/sepolia-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("📄 Deployment info saved to deployments/");
  console.log("\n⚠️  Important: Sepolia deployment uses mock FHE values.");
  console.log("For full FHE functionality, deploy to Zama Devnet using 'npm run deploy:devnet'");
  
  // Verify contracts on Etherscan (if API key is available)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: ballotAddress,
        constructorArguments: [mockCtZero, mockCtOne],
      });
      console.log("✅ FHEBallot verified");
      
      await hre.run("verify:verify", {
        address: quadraticAddress,
        constructorArguments: [mockCtZero, mockCtOne],
      });
      console.log("✅ FHEQuadraticVoting verified");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });