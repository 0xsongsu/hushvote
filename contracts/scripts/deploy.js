const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting FHE Voting Platform deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy FHEBallot
  console.log("Deploying FHEBallot...");
  const FHEBallot = await ethers.getContractFactory("FHEBallot");
  const ballot = await FHEBallot.deploy();
  await ballot.waitForDeployment();
  const ballotAddress = await ballot.getAddress();
  console.log("FHEBallot deployed to:", ballotAddress);

  // Deploy FHEQuadraticVoting
  console.log("\nDeploying FHEQuadraticVoting...");
  const FHEQuadraticVoting = await ethers.getContractFactory("FHEQuadraticVoting");
  const quadraticVoting = await FHEQuadraticVoting.deploy();
  await quadraticVoting.waitForDeployment();
  const quadraticAddress = await quadraticVoting.getAddress();
  console.log("FHEQuadraticVoting deployed to:", quadraticAddress);

  // Create sample voting for demonstration
  console.log("\nCreating sample voting instances...");
  
  // Sample single-choice voting
  const singleChoiceConfig = {
    name: "Presidential Election 2024",
    description: "Vote for the next president",
    voteType: 0, // SingleChoice
    startTime: Math.floor(Date.now() / 1000) + 3600, // Start in 1 hour
    endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // End in 7 days
    quorum: 100,
    whitelistEnabled: false,
    maxVotersCount: 10000
  };

  const singleChoiceOptions = [
    "Candidate A",
    "Candidate B",
    "Candidate C",
    "Abstain"
  ];

  const singleChoiceDescriptions = [
    "Progressive Party candidate with focus on technology",
    "Conservative Party candidate with focus on economy",
    "Independent candidate with focus on environment",
    "Choose not to vote for any candidate"
  ];

  const tx1 = await ballot.createVoting(
    singleChoiceConfig,
    singleChoiceOptions,
    singleChoiceDescriptions
  );
  await tx1.wait();
  console.log("Created single-choice voting (ID: 0)");

  // Sample quadratic voting
  const quadraticConfig = {
    name: "Budget Allocation 2024",
    description: "Allocate city budget using quadratic voting",
    voteType: 3, // Quadratic
    startTime: Math.floor(Date.now() / 1000) + 3600,
    endTime: Math.floor(Date.now() / 1000) + 86400 * 14, // End in 14 days
    quorum: 50,
    whitelistEnabled: true,
    maxVotersCount: 1000
  };

  const quadraticOptions = [
    "Education",
    "Healthcare",
    "Infrastructure",
    "Public Safety",
    "Environment"
  ];

  const quadraticDescriptions = [
    "Funding for schools and educational programs",
    "Hospital improvements and health services",
    "Roads, bridges, and public transportation",
    "Police, fire, and emergency services",
    "Parks, green spaces, and sustainability initiatives"
  ];

  const tx2 = await quadraticVoting.createVoting(
    quadraticConfig,
    quadraticOptions,
    quadraticDescriptions
  );
  await tx2.wait();
  console.log("Created quadratic voting (ID: 0)");

  // Set default credits for quadratic voting
  const tx3 = await quadraticVoting.setDefaultCredits(0, 100);
  await tx3.wait();
  console.log("Set default credits to 100 for quadratic voting");

  // Sample weighted voting
  const weightedConfig = {
    name: "Shareholder Resolution Vote",
    description: "Vote on company merger proposal",
    voteType: 2, // Weighted
    startTime: Math.floor(Date.now() / 1000) + 7200,
    endTime: Math.floor(Date.now() / 1000) + 86400 * 30, // End in 30 days
    quorum: 1000,
    whitelistEnabled: true,
    maxVotersCount: 5000
  };

  const weightedOptions = [
    "Approve Merger",
    "Reject Merger",
    "Abstain"
  ];

  const weightedDescriptions = [
    "Approve the proposed merger with XYZ Corporation",
    "Reject the proposed merger and remain independent",
    "Abstain from voting on this resolution"
  ];

  const tx4 = await ballot.createVoting(
    weightedConfig,
    weightedOptions,
    weightedDescriptions
  );
  await tx4.wait();
  console.log("Created weighted voting (ID: 1)");

  // Deployment summary
  console.log("\n========================================");
  console.log("Deployment Summary");
  console.log("========================================");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nDeployed Contracts:");
  console.log("- FHEBallot:", ballotAddress);
  console.log("- FHEQuadraticVoting:", quadraticAddress);
  console.log("\nSample Votings Created:");
  console.log("- Single-choice voting (Presidential Election)");
  console.log("- Quadratic voting (Budget Allocation)");
  console.log("- Weighted voting (Shareholder Resolution)");
  console.log("========================================\n");

  // Save deployment addresses to file
  const fs = require("fs");
  const deploymentData = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      FHEBallot: ballotAddress,
      FHEQuadraticVoting: quadraticAddress
    },
    sampleVotings: [
      {
        id: 0,
        contract: "FHEBallot",
        type: "SingleChoice",
        name: "Presidential Election 2024"
      },
      {
        id: 0,
        contract: "FHEQuadraticVoting",
        type: "Quadratic",
        name: "Budget Allocation 2024"
      },
      {
        id: 1,
        contract: "FHEBallot",
        type: "Weighted",
        name: "Shareholder Resolution Vote"
      }
    ]
  };

  const deploymentPath = `./deployments/${hre.network.name}-${Date.now()}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`Deployment data saved to: ${deploymentPath}`);

  // Verify contracts if not on localhost
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\nWaiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute

    console.log("Verifying contracts...");
    try {
      await hre.run("verify:verify", {
        address: ballotAddress,
        constructorArguments: [],
      });
      console.log("FHEBallot verified");

      await hre.run("verify:verify", {
        address: quadraticAddress,
        constructorArguments: [],
      });
      console.log("FHEQuadraticVoting verified");
    } catch (error) {
      console.error("Verification failed:", error.message);
    }
  }

  console.log("\nDeployment complete!");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });