const hre = require("hardhat");
const { ethers } = require("hardhat");

// Usage:
//   SEPOLIA_RPC_URL=... DEPLOYER_PRIVATE_KEY=... \
//   CONTRACT_ADDRESS=0x... \
//   node scripts/create-voting-sepolia.js

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Missing CONTRACT_ADDRESS env var");
  }

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);
  console.log("Network:", hre.network.name);
  console.log("FHEBallot:", contractAddress);

  const ballot = await ethers.getContractAt("FHEBallot", contractAddress, signer);

  const now = Math.floor(Date.now() / 1000);
  const config = {
    name: "HV Smoke Test",
    description: "Smoke test for createVoting on Sepolia",
    voteType: 0, // SingleChoice
    startTime: now + 60,
    endTime: now + 3600, // 1 hour window
    quorum: 1,
    whitelistEnabled: false,
    maxVotersCount: 1000,
  };
  const optionNames = ["Yes", "No"];
  const optionDescriptions = ["Approve", "Reject"];

  console.log("Sending createVoting...");
  const tx = await ballot.createVoting(config, optionNames, optionDescriptions);
  const rc = await tx.wait();
  console.log("createVoting tx:", rc?.hash);

  // Derive created votingId from event
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
  const iface = new ethers.Interface([
    "event VotingCreated(uint256 indexed votingId, string name, uint8 voteType, uint256 startTime, uint256 endTime)",
  ]);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (parsed?.name === "VotingCreated") {
        console.log("Created votingId:", parsed.args.votingId.toString());
      }
    } catch (_) {}
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("create-voting-sepolia failed:", err);
  process.exit(1);
});

