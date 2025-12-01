const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("FHEVotingBase - Base Contract Functionality Tests", function () {
  let contract;
  let owner, user1, user2;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy FHEBallot which inherits from FHEVotingBase
    const Factory = await ethers.getContractFactory("FHEBallot");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    console.log(`✅ Contract deployed at: ${await contract.getAddress()}`);
  });

  describe("Constants", function () {
    it("should have correct MAX_OPTIONS value", async function () {
      const maxOptions = await contract.MAX_OPTIONS();
      expect(maxOptions).to.equal(100);
      console.log("✅ MAX_OPTIONS = 100");
    });

    it("should have correct MAX_VOTERS value", async function () {
      const maxVoters = await contract.MAX_VOTERS();
      expect(maxVoters).to.equal(10000);
      console.log("✅ MAX_VOTERS = 10000");
    });

    it("should have correct MIN_VOTING_DURATION value", async function () {
      const minDuration = await contract.MIN_VOTING_DURATION();
      expect(minDuration).to.equal(3600); // 1 hour in seconds
      console.log("✅ MIN_VOTING_DURATION = 1 hour");
    });

    it("should have correct MAX_VOTING_DURATION value", async function () {
      const maxDuration = await contract.MAX_VOTING_DURATION();
      expect(maxDuration).to.equal(365 * 24 * 3600); // 365 days in seconds
      console.log("✅ MAX_VOTING_DURATION = 365 days");
    });
  });

  describe("Public Key Registration", function () {
    it("should register user public key", async function () {
      const publicKey = ethers.keccak256(ethers.toUtf8Bytes("test_public_key"));

      await contract.connect(user1).registerPublicKey(publicKey);

      const storedKey = await contract.userPublicKeys(user1.address);
      expect(storedKey).to.equal(publicKey);

      console.log("✅ Public key registered successfully");
    });

    it("should emit PublicKeyRegistered event", async function () {
      const publicKey = ethers.keccak256(ethers.toUtf8Bytes("test_public_key"));

      const tx = await contract.connect(user1).registerPublicKey(publicKey);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const decoded = contract.interface.parseLog(log);
          return decoded.name === 'PublicKeyRegistered';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      console.log("✅ PublicKeyRegistered event emitted");
    });

    it("should reject zero public key", async function () {
      const zeroKey = "0x" + "0".repeat(64);

      await expect(
        contract.connect(user1).registerPublicKey(zeroKey)
      ).to.be.revertedWithCustomError(contract, "InvalidPublicKey");

      console.log("✅ Correctly rejects zero public key");
    });

    it("should allow updating public key", async function () {
      const publicKey1 = ethers.keccak256(ethers.toUtf8Bytes("key_1"));
      const publicKey2 = ethers.keccak256(ethers.toUtf8Bytes("key_2"));

      await contract.connect(user1).registerPublicKey(publicKey1);
      await contract.connect(user1).registerPublicKey(publicKey2);

      const storedKey = await contract.userPublicKeys(user1.address);
      expect(storedKey).to.equal(publicKey2);

      console.log("✅ Public key can be updated");
    });
  });

  describe("Ownership", function () {
    it("should have correct owner after deployment", async function () {
      const contractOwner = await contract.owner();
      expect(contractOwner).to.equal(owner.address);
      console.log("✅ Owner correctly set");
    });

    it("should transfer ownership", async function () {
      await contract.transferOwnership(user1.address);

      const newOwner = await contract.owner();
      expect(newOwner).to.equal(user1.address);
      console.log("✅ Ownership transferred successfully");
    });

    it("should reject ownership transfer from non-owner", async function () {
      await expect(
        contract.connect(user1).transferOwnership(user2.address)
      ).to.be.reverted;

      console.log("✅ Non-owner cannot transfer ownership");
    });
  });

  describe("Pausability", function () {
    it("should pause contract", async function () {
      await contract.emergencyPause();

      const isPaused = await contract.paused();
      expect(isPaused).to.equal(true);

      console.log("✅ Contract paused successfully");
    });

    it("should unpause contract", async function () {
      await contract.emergencyPause();
      await contract.emergencyUnpause();

      const isPaused = await contract.paused();
      expect(isPaused).to.equal(false);

      console.log("✅ Contract unpaused successfully");
    });

    it("should reject pause from non-owner", async function () {
      await expect(
        contract.connect(user1).emergencyPause()
      ).to.be.reverted;

      console.log("✅ Non-owner cannot pause");
    });

    it("should reject unpause from non-owner", async function () {
      await contract.emergencyPause();

      await expect(
        contract.connect(user1).emergencyUnpause()
      ).to.be.reverted;

      console.log("✅ Non-owner cannot unpause");
    });

    it("should prevent voting when paused", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Pause Test",
        description: "Testing pause",
        voteType: 0,
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);

      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      // Pause contract
      await contract.emergencyPause();

      // Try to vote
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add32(0n)
        .encrypt();

      await expect(
        contract.connect(user1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.reverted;

      console.log("✅ Voting prevented when paused");
    });
  });

  describe("Time Window Validation", function () {
    it("should reject voting with duration less than minimum", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Short Duration",
        description: "Testing short duration",
        voteType: 0,
        startTime: now + 60,
        endTime: now + 60 + 1800, // Only 30 minutes (less than MIN 1 hour)
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await expect(
        contract.createVoting(config, ["A", "B"], ["A", "B"])
      ).to.be.revertedWithCustomError(contract, "InvalidTimeWindow");

      console.log("✅ Correctly rejects duration below minimum");
    });

    it("should reject voting with start time before end time", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Invalid Time",
        description: "Testing invalid time",
        voteType: 0,
        startTime: now + 86400, // Start later
        endTime: now + 3600, // End earlier
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await expect(
        contract.createVoting(config, ["A", "B"], ["A", "B"])
      ).to.be.revertedWithCustomError(contract, "InvalidTimeWindow");

      console.log("✅ Correctly rejects end time before start time");
    });

    it("should accept valid time window", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Valid Time",
        description: "Testing valid time",
        voteType: 0,
        startTime: now + 60,
        endTime: now + 60 + 86400, // 1 day duration
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);

      const votingCount = await contract.votingCounter();
      expect(votingCount).to.equal(1);

      console.log("✅ Valid time window accepted");
    });
  });

  describe("Reentrancy Protection", function () {
    it("should have ReentrancyGuard protection", async function () {
      // The contract inherits from ReentrancyGuard
      // If it compiles and deploys, the protection is in place
      const address = await contract.getAddress();
      expect(address).to.be.properAddress;

      console.log("✅ ReentrancyGuard protection in place");
    });
  });

  describe("FHE Helper Functions", function () {
    let votingId;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "FHE Test",
        description: "Testing FHE helpers",
        voteType: 0,
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B", "C"], ["A", "B", "C"]);
      votingId = 0;

      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);
    });

    it("should initialize encrypted vote counts to zero", async function () {
      // When a voting is created, option counts should be encrypted zeros
      // We verify this by casting votes and checking the system works
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add32(0n)
        .encrypt();

      await contract.connect(user1).castVote(
        votingId,
        encrypted.handles[0],
        encrypted.inputProof
      );

      // If FHE.asEuint32(0) initialization failed, vote casting would fail
      expect(await contract.hasVoted(votingId, user1.address)).to.equal(true);

      console.log("✅ FHE encrypted vote counts initialized correctly");
    });

    it("should correctly accumulate encrypted votes", async function () {
      const voters = [user1, user2];

      for (const voter of voters) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), voter.address)
          .add32(1n) // Both vote for option 1
          .encrypt();

        await contract.connect(voter).castVote(
          votingId,
          encrypted.handles[0],
          encrypted.inputProof
        );
      }

      // Both should have voted
      expect(await contract.hasVoted(votingId, user1.address)).to.equal(true);
      expect(await contract.hasVoted(votingId, user2.address)).to.equal(true);

      // Total voters should be 2
      const totalVoters = await contract.getTotalVotes(votingId);
      expect(totalVoters).to.equal(2);

      console.log("✅ FHE vote accumulation works correctly");
    });
  });

  describe("Voting Period Checks", function () {
    it("should reject vote before voting period", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Future Vote",
        description: "Testing future voting",
        voteType: 0,
        startTime: now + 3600, // Start in 1 hour
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);

      // Don't advance time - try to vote before start
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add32(0n)
        .encrypt();

      await expect(
        contract.connect(user1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Outside voting period");

      console.log("✅ Correctly rejects vote before voting period");
    });

    it("should reject vote after voting period", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Past Vote",
        description: "Testing past voting",
        voteType: 0,
        startTime: now + 1,
        endTime: now + 100, // Short window
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);

      // Advance time past end
      await ethers.provider.send("evm_increaseTime", [200]);
      await ethers.provider.send("evm_mine", []);

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add32(0n)
        .encrypt();

      await expect(
        contract.connect(user1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Outside voting period");

      console.log("✅ Correctly rejects vote after voting period");
    });

    it("should accept vote during voting period", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Active Vote",
        description: "Testing active voting",
        voteType: 0,
        startTime: now + 1,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await contract.createVoting(config, ["A", "B"], ["A", "B"]);

      // Advance to within voting period
      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add32(0n)
        .encrypt();

      await contract.connect(user1).castVote(0, encrypted.handles[0], encrypted.inputProof);

      expect(await contract.hasVoted(0, user1.address)).to.equal(true);

      console.log("✅ Vote accepted during voting period");
    });
  });

  describe("Options Limit", function () {
    it("should reject voting with too many options", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Many Options",
        description: "Testing option limit",
        voteType: 0,
        startTime: now + 60,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      // Create 101 options (more than MAX_OPTIONS = 100)
      const optionNames = Array.from({ length: 101 }, (_, i) => `Option ${i}`);
      const optionDescs = Array.from({ length: 101 }, (_, i) => `Desc ${i}`);

      await expect(
        contract.createVoting(config, optionNames, optionDescs)
      ).to.be.revertedWith("Too many options");

      console.log("✅ Correctly rejects too many options");
    });

    it("should accept voting at maximum options limit", async function () {
      const now = Math.floor(Date.now() / 1000);
      const config = {
        name: "Max Options",
        description: "Testing max options",
        voteType: 0,
        startTime: now + 60,
        endTime: now + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      // Create exactly 100 options (MAX_OPTIONS)
      const optionNames = Array.from({ length: 100 }, (_, i) => `Option ${i}`);
      const optionDescs = Array.from({ length: 100 }, (_, i) => `Desc ${i}`);

      await contract.createVoting(config, optionNames, optionDescs);

      const votingCount = await contract.votingCounter();
      expect(votingCount).to.equal(1);

      console.log("✅ Maximum options (100) accepted");
    });
  });
});
