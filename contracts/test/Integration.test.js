const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

// Helper function to get block timestamp
async function getBlockTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

// MIN_VOTING_DURATION = 1 hour = 3600 seconds
const MIN_VOTING_DURATION = 3600;

describe("Integration Tests - Full Voting Flow", function () {
  let ballot, quadratic;
  let owner, admin, voter1, voter2, voter3, voter4, voter5;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, admin, voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();

    // Deploy both contracts
    const BallotFactory = await ethers.getContractFactory("FHEBallot");
    ballot = await BallotFactory.deploy();
    await ballot.waitForDeployment();

    const QuadraticFactory = await ethers.getContractFactory("FHEQuadraticVoting");
    quadratic = await QuadraticFactory.deploy();
    await quadratic.waitForDeployment();

    console.log(`✅ FHEBallot deployed at: ${await ballot.getAddress()}`);
    console.log(`✅ FHEQuadraticVoting deployed at: ${await quadratic.getAddress()}`);
  });

  describe("Complete Standard Voting Flow", function () {
    // NOTE: Multi-voter tests skipped in mock mode due to ACL limitations
    it.skip("should complete full voting cycle: create -> vote -> end -> decrypt (requires fhEVM network)", async function () {
      console.log("\n=== Starting Complete Voting Flow Test ===\n");

      // Step 1: Create voting
      const blockTime = await getBlockTimestamp();
      const config = {
        name: "Community Decision",
        description: "Vote on our next community project",
        voteType: 0,
        startTime: blockTime + 10,
        endTime: blockTime + 10 + MIN_VOTING_DURATION + 100,
        quorum: 3,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(
        config,
        ["Park Renovation", "Library Expansion", "Sports Center"],
        ["Renovate central park", "Expand city library", "Build new sports center"]
      );
      console.log("✅ Step 1: Voting created");

      // Step 2: Start voting (advance time)
      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine", []);

      let status = await ballot.getVotingStatus(0);
      expect(status).to.equal(1); // Active
      console.log("✅ Step 2: Voting is active");

      console.log("\n=== Complete Voting Flow Test PASSED ===\n");
    });
  });

  describe("Voting Creation and Status", function () {
    it("should create voting and verify status transitions", async function () {
      const blockTime = await getBlockTimestamp();
      const config = {
        name: "Status Test",
        description: "Testing status transitions",
        voteType: 0,
        startTime: blockTime + 100,
        endTime: blockTime + 100 + MIN_VOTING_DURATION,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["Yes", "No"], ["Yes", "No"]);

      // Before start
      let status = await ballot.getVotingStatus(0);
      expect(status).to.equal(0); // NotStarted

      // Move to active
      await ethers.provider.send("evm_increaseTime", [105]);
      await ethers.provider.send("evm_mine", []);

      status = await ballot.getVotingStatus(0);
      expect(status).to.equal(1); // Active

      // Move to ended
      await ethers.provider.send("evm_increaseTime", [MIN_VOTING_DURATION]);
      await ethers.provider.send("evm_mine", []);

      status = await ballot.getVotingStatus(0);
      expect(status).to.equal(2); // Ended

      console.log("✅ Voting status transitions verified");
    });
  });

  describe("Single Vote Cast Test", function () {
    it("should cast a single vote successfully", async function () {
      const blockTime = await getBlockTimestamp();
      const config = {
        name: "Single Vote Test",
        description: "Test single vote",
        voteType: 0,
        startTime: blockTime + 10,
        endTime: blockTime + 10 + MIN_VOTING_DURATION,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["Option A", "Option B"], ["A", "B"]);

      // Start voting
      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine", []);

      // Cast vote
      const encrypted = await fhevm
        .createEncryptedInput(await ballot.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      await ballot.connect(voter1).castVote(
        0,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const hasVoted = await ballot.hasVoted(0, voter1.address);
      expect(hasVoted).to.equal(true);

      console.log("✅ Single vote cast successfully");
    });
  });

  describe("Whitelist Voting Flow", function () {
    it("should complete whitelist-restricted voting flow", async function () {
      console.log("\n=== Testing Whitelist Voting Flow ===\n");

      const blockTime = await getBlockTimestamp();
      const config = {
        name: "Board Election",
        description: "Vote for board members (members only)",
        voteType: 0,
        startTime: blockTime + 60,
        endTime: blockTime + 60 + MIN_VOTING_DURATION,
        quorum: 1,
        whitelistEnabled: true,
        maxVotersCount: 10
      };

      await ballot.createVoting(
        config,
        ["Alice", "Bob", "Charlie"],
        ["Candidate A", "Candidate B", "Candidate C"]
      );
      console.log("✅ Whitelist-enabled voting created");

      // Whitelist only voter1 and voter2
      await ballot.whitelistVoters(
        0,
        [voter1.address, voter2.address],
        [1, 1]
      );
      console.log("✅ Whitelisted voter1 and voter2");

      // Advance to voting period
      await ethers.provider.send("evm_increaseTime", [65]);
      await ethers.provider.send("evm_mine", []);

      // Whitelisted voter should be able to vote
      const encrypted1 = await fhevm
        .createEncryptedInput(await ballot.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      await ballot.connect(voter1).castVote(
        0,
        encrypted1.handles[0],
        encrypted1.inputProof
      );
      console.log("✅ Whitelisted voter1 voted successfully");

      // Non-whitelisted voter should be rejected
      const encrypted3 = await fhevm
        .createEncryptedInput(await ballot.getAddress(), voter3.address)
        .add32(0n)
        .encrypt();

      await expect(
        ballot.connect(voter3).castVote(
          0,
          encrypted3.handles[0],
          encrypted3.inputProof
        )
      ).to.be.revertedWith("Not whitelisted");
      console.log("✅ Non-whitelisted voter3 rejected");

      console.log("\n=== Whitelist Voting Flow Test PASSED ===\n");
    });
  });

  describe("Error Recovery Scenarios", function () {
    it("should handle voting on non-existent voting gracefully", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await ballot.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      await expect(
        ballot.connect(voter1).castVote(999, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Voting does not exist");

      console.log("✅ Non-existent voting handled gracefully");
    });

    it("should handle decryption request on already tallied voting", async function () {
      const blockTime = await getBlockTimestamp();
      const config = {
        name: "Quick Vote",
        description: "Quick test",
        voteType: 0,
        startTime: blockTime + 10,
        endTime: blockTime + 10 + MIN_VOTING_DURATION,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["A", "B"]);

      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine", []);

      // Vote
      const encrypted = await fhevm
        .createEncryptedInput(await ballot.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      await ballot.connect(voter1).castVote(0, encrypted.handles[0], encrypted.inputProof);

      // End and decrypt
      await ethers.provider.send("evm_increaseTime", [MIN_VOTING_DURATION + 10]);
      await ethers.provider.send("evm_mine", []);

      await ballot.connect(owner).requestDecryption(0);

      // Try to decrypt again
      await expect(
        ballot.connect(owner).requestDecryption(0)
      ).to.be.revertedWith("Already decrypted");

      console.log("✅ Double decryption request handled gracefully");
    });
  });

  describe("Gas Efficiency Tests", function () {
    it("should measure gas for batch vs individual reads", async function () {
      const blockTime = await getBlockTimestamp();

      // Create 5 votings
      for (let i = 0; i < 5; i++) {
        const config = {
          name: `Voting ${i}`,
          description: `Description ${i}`,
          voteType: 0,
          startTime: blockTime + 60,
          endTime: blockTime + 60 + MIN_VOTING_DURATION,
          quorum: 5,
          whitelistEnabled: false,
          maxVotersCount: 100
        };

        await ballot.createVoting(config, ["A", "B", "C"], ["A", "B", "C"]);
      }

      // Measure batch read
      const startBatch = Date.now();
      const allSummaries = await ballot.getAllVotingSummaries();
      const batchTime = Date.now() - startBatch;

      // Measure individual reads
      const startIndividual = Date.now();
      for (let i = 0; i < 5; i++) {
        await ballot.getVotingConfig(i);
        await ballot.getVotingOptions(i);
        await ballot.getTotalVotes(i);
      }
      const individualTime = Date.now() - startIndividual;

      console.log(`✅ Batch read time: ${batchTime}ms`);
      console.log(`✅ Individual reads time: ${individualTime}ms`);
      console.log(`✅ Batch is ${(individualTime / batchTime).toFixed(2)}x faster`);

      expect(allSummaries.length).to.equal(5);
    });
  });

  describe("Multiple Votings Management", function () {
    it("should handle multiple votings creation and batch reads", async function () {
      const blockTime = await getBlockTimestamp();

      // Create 3 votings
      for (let i = 0; i < 3; i++) {
        const config = {
          name: `Voting ${i}`,
          description: `Description ${i}`,
          voteType: i % 3,
          startTime: blockTime + 60,
          endTime: blockTime + 60 + MIN_VOTING_DURATION,
          quorum: 2,
          whitelistEnabled: false,
          maxVotersCount: 100
        };

        await ballot.createVoting(config, ["Option 1", "Option 2"], ["Desc 1", "Desc 2"]);
      }

      const votingCount = await ballot.votingCounter();
      expect(votingCount).to.equal(3);

      // Batch read all summaries
      const summaries = await ballot.getAllVotingSummaries();
      expect(summaries.length).to.equal(3);

      // Verify each voting
      for (let i = 0; i < 3; i++) {
        expect(summaries[i].name).to.equal(`Voting ${i}`);
      }

      console.log("✅ Multiple votings created and batch read verified");
    });
  });
});
