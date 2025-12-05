const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const ballot = await ethers.getContractAt("FHEBallot", "0x14F44201Cb91929e4dddB5455DE26B720A81d327");
  const block = await ethers.provider.getBlock("latest");
  const blockTs = Number(block.timestamp);
  console.log("Current block timestamp:", blockTs);
  console.log("Current block date:", new Date(blockTs * 1000).toISOString());

  const count = await ballot.votingCounter();
  console.log("\nTotal votings in FHEBallot:", count.toString());

  console.log("\n=== All Voting Status ===");
  const statusNames = ["NotStarted", "Active", "Ended", "Tallied"];
  for (let i = 0; i < Number(count); i++) {
    const config = await ballot.getVotingConfig(i);
    const status = await ballot.getVotingStatus(i);
    const startTs = Number(config.startTime);
    const endTs = Number(config.endTime);
    console.log("ID " + i + ": " + config.name + " - Status: " + statusNames[status] + " (" + status + ")");
    console.log("    Start: " + new Date(startTs * 1000).toISOString());
    console.log("    End:   " + new Date(endTs * 1000).toISOString());
    console.log("    Now vs End: " + (blockTs < endTs ? "NOT EXPIRED" : "EXPIRED"));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
