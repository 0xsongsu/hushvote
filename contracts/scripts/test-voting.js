const { ethers } = require("hardhat");

async function main() {
  console.log("Testing HushVote contract functionality...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract address
  const contractAddress = "0x554a8Fb8481D09Abf0b8Be856253bc47a372a5C0";
  const FHEBallot = await ethers.getContractFactory("FHEBallot");
  const ballot = FHEBallot.attach(contractAddress);

  // Get current block timestamp
  const block = await ethers.provider.getBlock("latest");
  const now = block.timestamp;

  // Create immediate voting
  console.log("Creating immediate voting...");
  const votingConfig = {
    name: "Quick Test Vote",
    description: "Testing immediate voting",
    voteType: 0, // Single choice
    startTime: now + 60, // Start in 1 minute
    endTime: now + 86400, // 24 hours from now
    quorum: 1,
    whitelistEnabled: false,
    maxVotersCount: 1000000
  };

  const tx1 = await ballot.createVoting(
    votingConfig,
    ["Approve", "Reject"],
    ["Approve the proposal", "Reject the proposal"]
  );
  
  const receipt1 = await tx1.wait();
  console.log("Voting created!");

  // Get voting ID from events
  const event = receipt1.logs.find(log => {
    try {
      const parsed = ballot.interface.parseLog(log);
      return parsed?.name === "VotingCreated";
    } catch {
      return false;
    }
  });

  const parsedEvent = ballot.interface.parseLog(event);
  const votingId = parsedEvent.args[0];
  console.log("Voting ID:", votingId.toString());

  // Wait for start time
  console.log("\nWaiting 65 seconds for voting start time...");
  await new Promise(resolve => setTimeout(resolve, 65000));

  // Start voting
  console.log("\nStarting voting...");
  const tx2 = await ballot.startVoting(votingId);
  await tx2.wait();
  console.log("Voting started!");

  // Cast a vote
  console.log("\nCasting vote...");
  const encryptedVote = ethers.hexlify(ethers.randomBytes(32));
  const proof = ethers.hexlify(ethers.randomBytes(64));
  
  const tx3 = await ballot.castVote(votingId, encryptedVote, proof);
  await tx3.wait();
  console.log("Vote cast successfully!");

  // Check status
  const totalVoters = await ballot.getTotalVoters(votingId);
  const voterInfo = await ballot.getVoterInfo(votingId, deployer.address);
  const status = await ballot.getVotingStatus(votingId);

  console.log("\n=== Results ===");
  console.log("Total voters:", totalVoters.toString());
  console.log("Has voted:", voterInfo.hasVoted);
  console.log("Voting status:", ["NotStarted", "Active", "Ended", "Tallied"][status]);
  
  console.log("\n✅ All tests passed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });