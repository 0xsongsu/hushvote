const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("FHEQuadraticVoting - Quadratic Voting Tests", function () {
  let contract;
  let owner, voter1, voter2, voter3, voter4, voter5;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FHEQuadraticVoting");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    console.log(`✅ FHEQuadraticVoting deployed at: ${await contract.getAddress()}`);
  });

  describe("Quadratic Voting Creation", function () {
    it("should create quadratic voting successfully", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Budget Allocation",
        description: "Allocate budget using quadratic voting",
        voteType: 3, // Quadratic
        startTime: now + 60,
        endTime: now + 86400,
        quorum: 10,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      const optionNames = ["Education", "Healthcare", "Infrastructure", "Environment"];
      const optionDescriptions = ["Schools", "Hospitals", "Roads", "Parks"];

      const tx = await contract.createVoting(config, optionNames, optionDescriptions);
      await tx.wait();

      const votingConfig = await contract.getVotingConfig(0);
      expect(Number(votingConfig.voteType)).to.equal(3);

      console.log("✅ Quadratic voting created successfully");
    });

    it("should set default credits for quadratic voting", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Credits Test",
        description: "Testing credits",
        voteType: 3,
        startTime: now + 60,
        endTime: now + 86400,
        quorum: 5,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B", "C"], ["A", "B", "C"]);

      // Set default credits
      await contract.setDefaultCredits(0, 150);

      const credits = await contract.getVoterCredits(0, voter1.address);
      expect(credits).to.equal(150);

      console.log("✅ Default credits set successfully");
    });

    it("should allocate custom credits to specific voters", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Custom Credits",
        description: "Testing custom credits",
        voteType: 3,
        startTime: now + 60,
        endTime: now + 86400,
        quorum: 5,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);

      // Allocate different credits to different voters
      await contract.allocateCredits(0, voter1.address, 200);
      await contract.allocateCredits(0, voter2.address, 300);

      expect(await contract.getVoterCredits(0, voter1.address)).to.equal(200);
      expect(await contract.getVoterCredits(0, voter2.address)).to.equal(300);

      console.log("✅ Custom credits allocated successfully");
    });

    it("should reject invalid credits amount", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Invalid Credits",
        description: "Testing invalid credits",
        voteType: 3,
        startTime: now + 60,
        endTime: now + 86400,
        quorum: 5,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);

      // Try to set credits above max (1000)
      await expect(
        contract.setDefaultCredits(0, 1001)
      ).to.be.revertedWith("Invalid credits amount");

      // Try to set credits below min (1)
      await expect(
        contract.setDefaultCredits(0, 0)
      ).to.be.revertedWith("Invalid credits amount");

      console.log("✅ Correctly rejects invalid credits amount");
    });
  });

  describe("Quadratic Cost Calculation", function () {
    it("should calculate quadratic cost correctly", async function () {
      // votes^2 = cost
      expect(await contract.calculateQuadraticCost(1)).to.equal(1);   // 1^2 = 1
      expect(await contract.calculateQuadraticCost(2)).to.equal(4);   // 2^2 = 4
      expect(await contract.calculateQuadraticCost(3)).to.equal(9);   // 3^2 = 9
      expect(await contract.calculateQuadraticCost(4)).to.equal(16);  // 4^2 = 16
      expect(await contract.calculateQuadraticCost(5)).to.equal(25);  // 5^2 = 25
      expect(await contract.calculateQuadraticCost(10)).to.equal(100); // 10^2 = 100

      console.log("✅ Quadratic cost calculation works correctly");
    });

    it("should handle edge case: zero votes", async function () {
      expect(await contract.calculateQuadraticCost(0)).to.equal(0);
      console.log("✅ Zero votes cost calculation works");
    });
  });

  describe("Quadratic Vote Casting", function () {
    let votingId;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "QV Vote Test",
        description: "Testing quadratic vote casting",
        voteType: 3, // Quadratic
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["Option A", "Option B", "Option C"], ["A", "B", "C"]);
      votingId = 0;

      // Set default credits
      await contract.setDefaultCredits(votingId, 100);

      // Advance time to start voting
      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);
    });

    it("should cast quadratic vote with valid credit allocation", async function () {
      // Create encrypted votes for 3 options
      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(5n) // 5 votes for option A (cost: 25)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(3n) // 3 votes for option B (cost: 9)
        .encrypt();

      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(2n) // 2 votes for option C (cost: 4)
        .encrypt();

      // Total cost: 25 + 9 + 4 = 38 (within 100 credits)
      const credits = [25, 9, 4]; // Credits allocated per option

      await contract.connect(voter1).castQuadraticVote(
        votingId,
        [encrypted0.handles[0], encrypted1.handles[0], encrypted2.handles[0]],
        credits,
        encrypted0.inputProof // Use first proof for validation
      );

      expect(await contract.hasVoted(votingId, voter1.address)).to.equal(true);

      // Check remaining credits
      const remainingCredits = await contract.getVoterCredits(votingId, voter1.address);
      expect(remainingCredits).to.equal(100 - 38); // 62 remaining

      console.log("✅ Quadratic vote cast successfully");
    });

    it("should prevent voting with insufficient credits", async function () {
      // Try to allocate more credits than available (100)
      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(10n)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      // Try to allocate 150 credits (more than 100 available)
      const credits = [100, 25, 25]; // Total: 150

      await expect(
        contract.connect(voter1).castQuadraticVote(
          votingId,
          [encrypted0.handles[0], encrypted1.handles[0], encrypted2.handles[0]],
          credits,
          encrypted0.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "InsufficientCredits");

      console.log("✅ Correctly rejects insufficient credits");
    });

    it("should prevent double voting in quadratic voting", async function () {
      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const credits = [1, 1, 1];

      // First vote
      await contract.connect(voter1).castQuadraticVote(
        votingId,
        [encrypted0.handles[0], encrypted1.handles[0], encrypted2.handles[0]],
        credits,
        encrypted0.inputProof
      );

      // Attempt second vote
      const encrypted0_2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const encrypted1_2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const encrypted2_2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      await expect(
        contract.connect(voter1).castQuadraticVote(
          votingId,
          [encrypted0_2.handles[0], encrypted1_2.handles[0], encrypted2_2.handles[0]],
          credits,
          encrypted0_2.inputProof
        )
      ).to.be.revertedWith("Already voted");

      console.log("✅ Double voting prevention works in quadratic voting");
    });

    it("should require correct number of options", async function () {
      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      // Only 2 encrypted votes for 3 options
      const credits = [1, 1];

      await expect(
        contract.connect(voter1).castQuadraticVote(
          votingId,
          [encrypted0.handles[0], encrypted1.handles[0]], // Only 2 handles
          credits,
          encrypted0.inputProof
        )
      ).to.be.revertedWith("Invalid options count");

      console.log("✅ Correctly validates option count");
    });

    it("should handle all credits to single option", async function () {
      // Allocate all credits to one option
      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(10n) // sqrt(100) = 10 votes
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      // All 100 credits to option A
      const credits = [100, 0, 0];

      await contract.connect(voter1).castQuadraticVote(
        votingId,
        [encrypted0.handles[0], encrypted1.handles[0], encrypted2.handles[0]],
        credits,
        encrypted0.inputProof
      );

      expect(await contract.hasVoted(votingId, voter1.address)).to.equal(true);
      expect(await contract.getVoterCredits(votingId, voter1.address)).to.equal(0);

      console.log("✅ Single option allocation works");
    });

    it("should track total voters correctly in quadratic voting", async function () {
      const voters = [voter1, voter2, voter3];

      for (const voter of voters) {
        const encrypted0 = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add32(1n)
          .encrypt();

        const encrypted1 = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add32(1n)
          .encrypt();

        const encrypted2 = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add32(1n)
          .encrypt();

        await contract.connect(voter).castQuadraticVote(
          votingId,
          [encrypted0.handles[0], encrypted1.handles[0], encrypted2.handles[0]],
          [1, 1, 1],
          encrypted0.inputProof
        );
      }

      const totalVoters = await contract.getTotalVotes(votingId);
      expect(totalVoters).to.equal(3);

      console.log("✅ Total voters tracked correctly");
    });
  });

  describe("Quadratic Vote Allocation Retrieval", function () {
    let votingId;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Allocation Test",
        description: "Testing allocation retrieval",
        voteType: 3,
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);
      votingId = 0;
      await contract.setDefaultCredits(votingId, 100);

      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      // Cast a vote
      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(5n)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(3n)
        .encrypt();

      await contract.connect(voter1).castQuadraticVote(
        votingId,
        [encrypted0.handles[0], encrypted1.handles[0]],
        [25, 9], // 5^2 = 25, 3^2 = 9
        encrypted0.inputProof
      );
    });

    it("should retrieve vote allocation", async function () {
      const allocation = await contract.getVoteAllocation(votingId, voter1.address);
      expect(allocation.totalCreditsUsed).to.equal(34); // 25 + 9

      console.log("✅ Vote allocation retrieved successfully");
    });

    it("should verify allocation integrity", async function () {
      const isValid = await contract.verifyQuadraticAllocation(votingId, voter1.address);
      expect(isValid).to.equal(true);

      console.log("✅ Allocation integrity verified");
    });

    it("should return false for non-existent allocation", async function () {
      const isValid = await contract.verifyQuadraticAllocation(votingId, voter2.address);
      expect(isValid).to.equal(false);

      console.log("✅ Non-existent allocation returns false");
    });
  });

  describe("Credit Refunds", function () {
    let votingId;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Refund Test",
        description: "Testing credit refunds",
        voteType: 3,
        startTime: now + 1,
        endTime: now + 100,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);
      votingId = 0;
      await contract.setDefaultCredits(votingId, 100);

      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      // Cast a vote using only some credits
      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(3n)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(2n)
        .encrypt();

      await contract.connect(voter1).castQuadraticVote(
        votingId,
        [encrypted0.handles[0], encrypted1.handles[0]],
        [9, 4], // Total: 13 credits used
        encrypted0.inputProof
      );
    });

    it("should refund unused credits after voting ends", async function () {
      // End voting
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine", []);

      // Check credits before refund
      const creditsBefore = await contract.getVoterCredits(votingId, voter1.address);
      expect(creditsBefore).to.equal(87); // 100 - 13

      // Request refund
      await contract.refundUnusedCredits(votingId, voter1.address);

      // Credits should be zeroed (refunded)
      const creditsAfter = await contract.voterCredits(votingId, voter1.address);
      expect(creditsAfter).to.equal(0);

      console.log("✅ Credits refunded successfully");
    });

    it("should reject refund before voting ends", async function () {
      await expect(
        contract.refundUnusedCredits(votingId, voter1.address)
      ).to.be.revertedWith("Voting not ended");

      console.log("✅ Correctly rejects early refund request");
    });
  });

  describe("Quadratic Voting Statistics", function () {
    let votingId;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Stats Test",
        description: "Testing statistics",
        voteType: 3,
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B", "C"], ["A", "B", "C"]);
      votingId = 0;
      await contract.setDefaultCredits(votingId, 100);

      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      // Multiple voters
      const voters = [voter1, voter2];
      for (const voter of voters) {
        const encrypted0 = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add32(3n)
          .encrypt();

        const encrypted1 = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add32(2n)
          .encrypt();

        const encrypted2 = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add32(1n)
          .encrypt();

        await contract.connect(voter).castQuadraticVote(
          votingId,
          [encrypted0.handles[0], encrypted1.handles[0], encrypted2.handles[0]],
          [9, 4, 1], // 3^2 + 2^2 + 1^2 = 14 credits
          encrypted0.inputProof
        );
      }
    });

    it("should return voting statistics", async function () {
      const [totalAllocated, totalUsed, avgPerVoter] = await contract.getQuadraticVotingStats(votingId);

      expect(totalAllocated).to.equal(200); // 100 * 2 voters
      expect(avgPerVoter).to.be.gt(0);

      console.log("✅ Voting statistics retrieved successfully");
      console.log(`   Total Allocated: ${totalAllocated}`);
      console.log(`   Total Used (estimated): ${totalUsed}`);
      console.log(`   Avg Per Voter: ${avgPerVoter}`);
    });
  });

  describe("Event Emissions for Quadratic Voting", function () {
    it("should emit QuadraticVoteAllocated event", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Event Test",
        description: "Testing events",
        voteType: 3,
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);
      await contract.setDefaultCredits(0, 100);

      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const tx = await contract.connect(voter1).castQuadraticVote(
        0,
        [encrypted0.handles[0], encrypted1.handles[0]],
        [1, 1],
        encrypted0.inputProof
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const decoded = contract.interface.parseLog(log);
          return decoded.name === 'QuadraticVoteAllocated';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      console.log("✅ QuadraticVoteAllocated event emitted correctly");
    });

    it("should emit CreditsAllocated event when setting credits", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Credits Event",
        description: "Testing credits event",
        voteType: 3,
        startTime: now + 60,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);

      const tx = await contract.allocateCredits(0, voter1.address, 150);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const decoded = contract.interface.parseLog(log);
          return decoded.name === 'CreditsAllocated';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      console.log("✅ CreditsAllocated event emitted correctly");
    });
  });

  describe("Edge Cases", function () {
    it("should handle zero credit allocation to some options", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Zero Credits",
        description: "Testing zero credits",
        voteType: 3,
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B", "C"], ["A", "B", "C"]);
      await contract.setDefaultCredits(0, 100);

      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      // All credits to first option, zero to others
      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(10n)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      await contract.connect(voter1).castQuadraticVote(
        0,
        [encrypted0.handles[0], encrypted1.handles[0], encrypted2.handles[0]],
        [100, 0, 0],
        encrypted0.inputProof
      );

      expect(await contract.hasVoted(0, voter1.address)).to.equal(true);
      console.log("✅ Zero credit allocation to some options works");
    });

    it("should handle minimum credit allocation (1 credit)", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Min Credits",
        description: "Testing minimum credits",
        voteType: 3,
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);
      await contract.setDefaultCredits(0, 1); // Minimum credits

      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      const encrypted0 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(1n)
        .encrypt();

      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter1.address)
        .add32(0n)
        .encrypt();

      await contract.connect(voter1).castQuadraticVote(
        0,
        [encrypted0.handles[0], encrypted1.handles[0]],
        [1, 0],
        encrypted0.inputProof
      );

      expect(await contract.hasVoted(0, voter1.address)).to.equal(true);
      console.log("✅ Minimum credit allocation works");
    });
  });
});
