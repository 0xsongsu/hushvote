const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Creating multiple votings with different durations...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Contract addresses from latest deployment
  const BALLOT_ADDRESS = "0x14F44201Cb91929e4dddB5455DE26B720A81d327";
  const QUADRATIC_ADDRESS = "0x9a075d9a70Cb72884Abf2c42bd48497b1125510e";

  const ballot = await ethers.getContractAt("FHEBallot", BALLOT_ADDRESS);
  const quadratic = await ethers.getContractAt("FHEQuadraticVoting", QUADRATIC_ADDRESS);

  const now = Math.floor(Date.now() / 1000);
  const HOUR = 3600;
  const DAY = 24 * HOUR;

  // ============== BALLOT CONTRACT VOTINGS ==============

  // 1. Short Duration - 2 hours (starts in 1 min)
  console.log("Creating: Quick Poll (2 hours)...");
  const tx1 = await ballot.createVoting(
    {
      name: "Quick Team Lunch Poll",
      description: "Vote for today's team lunch location. Quick voting session!",
      voteType: 0, // SingleChoice
      startTime: now + 60, // Starts in 1 min
      endTime: now + 60 + 2 * HOUR, // 2 hours duration
      quorum: 5,
      whitelistEnabled: false,
      maxVotersCount: 100
    },
    ["Pizza Place", "Sushi Bar", "Burger Joint", "Salad Station"],
    ["Classic Italian pizzeria", "Fresh Japanese cuisine", "American burgers", "Healthy salads and bowls"]
  );
  await tx1.wait();
  console.log("✓ Created Quick Team Lunch Poll");

  // 2. Medium Duration - 1 day
  console.log("Creating: Feature Priority Vote (1 day)...");
  const tx2 = await ballot.createVoting(
    {
      name: "Product Feature Priority",
      description: "Help us decide which feature to build next. Results in 24 hours.",
      voteType: 0,
      startTime: now + 120,
      endTime: now + 120 + DAY, // 1 day
      quorum: 20,
      whitelistEnabled: false,
      maxVotersCount: 500
    },
    ["Dark Mode", "Mobile App", "API Integration", "Analytics Dashboard"],
    ["Add dark theme support", "Native iOS/Android apps", "REST API for developers", "Usage analytics and reports"]
  );
  await tx2.wait();
  console.log("✓ Created Product Feature Priority");

  // 3. 3 days duration
  console.log("Creating: Community Event (3 days)...");
  const tx3 = await ballot.createVoting(
    {
      name: "Community Meetup Location",
      description: "Choose the location for our next community meetup event.",
      voteType: 0,
      startTime: now + 180,
      endTime: now + 180 + 3 * DAY, // 3 days
      quorum: 50,
      whitelistEnabled: false,
      maxVotersCount: 1000
    },
    ["San Francisco", "New York", "London", "Singapore", "Virtual"],
    ["SF Bay Area meetup", "NYC downtown venue", "London tech hub", "Singapore fintech center", "Online event"]
  );
  await tx3.wait();
  console.log("✓ Created Community Meetup Location");

  // 4. 1 week duration
  console.log("Creating: Governance Proposal (1 week)...");
  const tx4 = await ballot.createVoting(
    {
      name: "Protocol Upgrade v2.0",
      description: "Vote on the proposed protocol upgrade including new FHE features and gas optimizations.",
      voteType: 0,
      startTime: now + 240,
      endTime: now + 240 + 7 * DAY, // 1 week
      quorum: 100,
      whitelistEnabled: false,
      maxVotersCount: 5000
    },
    ["Approve Upgrade", "Reject Upgrade", "Delay for Review"],
    ["Approve and deploy v2.0", "Reject the proposal", "Delay 30 days for more review"]
  );
  await tx4.wait();
  console.log("✓ Created Protocol Upgrade v2.0");

  // 5. Weighted voting - 5 days
  console.log("Creating: Treasury Allocation (Weighted, 5 days)...");
  const tx5 = await ballot.createVoting(
    {
      name: "Q1 Treasury Allocation",
      description: "Weighted vote on how to allocate the Q1 treasury funds. Voting power based on token holdings.",
      voteType: 2, // Weighted
      startTime: now + 300,
      endTime: now + 300 + 5 * DAY, // 5 days
      quorum: 200,
      whitelistEnabled: false,
      maxVotersCount: 2000
    },
    ["Development", "Marketing", "Community Grants", "Reserve"],
    ["Fund core development team", "Marketing and growth", "Community builder grants", "Keep in reserve"]
  );
  await tx5.wait();
  console.log("✓ Created Q1 Treasury Allocation");

  // 6. Multi-choice voting - 2 days
  console.log("Creating: Hackathon Tracks (Multi-choice, 2 days)...");
  const tx6 = await ballot.createVoting(
    {
      name: "Hackathon Track Selection",
      description: "Select which tracks you want to see at the upcoming hackathon. You can vote for multiple options!",
      voteType: 1, // MultiChoice
      startTime: now + 360,
      endTime: now + 360 + 2 * DAY, // 2 days
      quorum: 30,
      whitelistEnabled: false,
      maxVotersCount: 500
    },
    ["DeFi", "NFTs & Gaming", "Privacy & FHE", "Infrastructure", "Social & Identity"],
    ["Decentralized finance apps", "NFT and blockchain gaming", "Privacy-preserving tech", "Blockchain infrastructure", "Decentralized identity & social"]
  );
  await tx6.wait();
  console.log("✓ Created Hackathon Track Selection");

  // ============== QUADRATIC CONTRACT VOTINGS ==============

  // 7. Quadratic voting - 4 days
  console.log("Creating: Research Grants (Quadratic, 4 days)...");
  const tx7 = await quadratic.createVoting(
    {
      name: "Research Grant Allocation",
      description: "Use quadratic voting to fairly allocate research grants. Each voter has 100 credits.",
      voteType: 3, // Quadratic
      startTime: now + 420,
      endTime: now + 420 + 4 * DAY, // 4 days
      quorum: 25,
      whitelistEnabled: false,
      maxVotersCount: 200
    },
    ["ZK Proofs Research", "FHE Optimization", "Cross-chain Bridges", "MEV Protection"],
    ["Zero-knowledge proof improvements", "FHE performance optimization", "Secure cross-chain communication", "MEV protection mechanisms"]
  );
  await tx7.wait();
  // Get voting counter to find ID
  const qCount = await quadratic.votingCounter();
  const qId = Number(qCount) - 1;
  await quadratic.setDefaultCredits(qId, 100);
  console.log(`✓ Created Research Grant Allocation (ID: ${qId})`);

  // 8. Quadratic voting - 10 days
  console.log("Creating: Ecosystem Fund (Quadratic, 10 days)...");
  const tx8 = await quadratic.createVoting(
    {
      name: "Ecosystem Fund Distribution",
      description: "Quadratic voting for ecosystem fund. Express preference intensity with your credits.",
      voteType: 3,
      startTime: now + 480,
      endTime: now + 480 + 10 * DAY, // 10 days
      quorum: 50,
      whitelistEnabled: false,
      maxVotersCount: 1000
    },
    ["Developer Tools", "Education", "Security Audits", "Community Events", "Integrations"],
    ["Build better dev tools", "Educational content and courses", "Security audit fund", "Community conferences", "Protocol integrations"]
  );
  await tx8.wait();
  const qCount2 = await quadratic.votingCounter();
  const qId2 = Number(qCount2) - 1;
  await quadratic.setDefaultCredits(qId2, 150);
  console.log(`✓ Created Ecosystem Fund Distribution (ID: ${qId2})`);

  // Summary
  console.log("\n========================================");
  console.log("Created Votings Summary");
  console.log("========================================");
  console.log("\nFHEBallot Contract (" + BALLOT_ADDRESS + "):");
  console.log("  - Quick Team Lunch Poll (2 hours)");
  console.log("  - Product Feature Priority (1 day)");
  console.log("  - Community Meetup Location (3 days)");
  console.log("  - Protocol Upgrade v2.0 (1 week)");
  console.log("  - Q1 Treasury Allocation (5 days, Weighted)");
  console.log("  - Hackathon Track Selection (2 days, Multi-choice)");
  console.log("\nFHEQuadraticVoting Contract (" + QUADRATIC_ADDRESS + "):");
  console.log("  - Research Grant Allocation (4 days, 100 credits)");
  console.log("  - Ecosystem Fund Distribution (10 days, 150 credits)");
  console.log("========================================\n");
  console.log("All votings will become active shortly after creation.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
