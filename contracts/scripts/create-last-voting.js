const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Creating last quadratic voting...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const QUADRATIC_ADDRESS = "0x9a075d9a70Cb72884Abf2c42bd48497b1125510e";
  const quadratic = await ethers.getContractAt("FHEQuadraticVoting", QUADRATIC_ADDRESS);

  const now = Math.floor(Date.now() / 1000);
  const DAY = 24 * 3600;

  console.log("Creating: Ecosystem Fund (Quadratic, 10 days)...");
  const tx = await quadratic.createVoting(
    {
      name: "Ecosystem Fund Distribution",
      description: "Quadratic voting for ecosystem fund. Express preference intensity with your credits.",
      voteType: 3,
      startTime: now + 600,
      endTime: now + 600 + 10 * DAY,
      quorum: 50,
      whitelistEnabled: false,
      maxVotersCount: 1000
    },
    ["Developer Tools", "Education", "Security Audits", "Community Events", "Integrations"],
    ["Build better dev tools", "Educational content and courses", "Security audit fund", "Community conferences", "Protocol integrations"]
  );
  await tx.wait();

  const qCount = await quadratic.votingCounter();
  const qId = Number(qCount) - 1;

  const tx2 = await quadratic.setDefaultCredits(qId, 150);
  await tx2.wait();

  console.log(`✓ Created Ecosystem Fund Distribution (ID: ${qId})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
