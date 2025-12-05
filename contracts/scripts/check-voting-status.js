const { ethers } = require("hardhat");

async function main() {
  const block = await ethers.provider.getBlock("latest");
  console.log("Chain block timestamp:", block.timestamp);
  console.log("Chain block date:", new Date(Number(block.timestamp) * 1000).toISOString());
  
  const ballot = await ethers.getContractAt("FHEBallot", "0x14F44201Cb91929e4dddB5455DE26B720A81d327");
  const count = await ballot.votingCounter();
  console.log("Total votings:", count.toString());
  
  // Check last few votings
  for (let i = Math.max(0, Number(count) - 3); i < Number(count); i++) {
    const config = await ballot.getVotingConfig(i);
    const status = await ballot.getVotingStatus(i);
    console.log("\nVoting ID", i, ":");
    console.log("  Name:", config.name);
    console.log("  Start:", config.startTime.toString(), "=", new Date(Number(config.startTime) * 1000).toISOString());
    console.log("  End:", config.endTime.toString(), "=", new Date(Number(config.endTime) * 1000).toISOString());
    console.log("  Status:", status.toString(), status == 0 ? "(NotStarted)" : status == 1 ? "(Active)" : status == 2 ? "(Ended)" : "(Tallied)");
  }
}

main();
