const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FHE Voting Platform", function () {
  // Fixture for deploying contracts
  async function deployVotingFixture() {
    const [owner, voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();

    // Deploy FHEBallot
    const FHEBallot = await ethers.getContractFactory("FHEBallot");
    const ballot = await FHEBallot.deploy();

    // Deploy FHEQuadraticVoting
    const FHEQuadraticVoting = await ethers.getContractFactory("FHEQuadraticVoting");
    const quadraticVoting = await FHEQuadraticVoting.deploy();

    return { ballot, quadraticVoting, owner, voter1, voter2, voter3, voter4, voter5 };
  }

  describe("FHEBallot - Single Choice Voting", function () {
    it("Should create a new voting", async function () {
      const { ballot, owner } = await loadFixture(deployVotingFixture);

      const config = {
        name: "Test Election",
        description: "Test election description",
        voteType: 0, // SingleChoice
        startTime: (await time.latest()) + 3600,
        endTime: (await time.latest()) + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      const options = ["Option A", "Option B", "Option C"];
      const descriptions = ["Description A", "Description B", "Description C"];

      await expect(ballot.createVoting(config, options, descriptions))
        .to.emit(ballot, "VotingCreated")
        .withArgs(0, config.name, config.voteType, config.startTime, config.endTime);

      const votingConfig = await ballot.getVotingConfig(0);
      expect(votingConfig.name).to.equal(config.name);
      expect(votingConfig.voteType).to.equal(config.voteType);
    });

    it("Should not allow voting before start time", async function () {
      const { ballot, voter1 } = await loadFixture(deployVotingFixture);

      const config = {
        name: "Test Election",
        description: "Test election description",
        voteType: 0,
        startTime: (await time.latest()) + 3600,
        endTime: (await time.latest()) + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      // Try to vote before voting starts
      const encryptedVote = ethers.randomBytes(32);
      const proof = ethers.randomBytes(64);

      await expect(
        ballot.connect(voter1).castVote(0, encryptedVote, proof)
      ).to.be.revertedWith("Voting not active");
    });

    it("Should allow voting during voting period", async function () {
      const { ballot, owner, voter1 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Test Election",
        description: "Test election description",
        voteType: 0,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      // Move time to voting period
      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      // Cast vote
      const encryptedVote = ethers.randomBytes(32);
      const proof = ethers.randomBytes(64);

      await expect(ballot.connect(voter1).castVote(0, encryptedVote, proof))
        .to.emit(ballot, "VoteCast")
        .withArgs(0, voter1.address, await time.latest());

      // Check voter info
      const voterInfo = await ballot.getVoterInfo(0, voter1.address);
      expect(voterInfo.hasVoted).to.be.true;
    });

    it("Should not allow double voting", async function () {
      const { ballot, voter1 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Test Election",
        description: "Test election description",
        voteType: 0,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      const encryptedVote = ethers.randomBytes(32);
      const proof = ethers.randomBytes(64);

      await ballot.connect(voter1).castVote(0, encryptedVote, proof);

      // Try to vote again
      const newProof = ethers.randomBytes(64);
      await expect(
        ballot.connect(voter1).castVote(0, encryptedVote, newProof)
      ).to.be.revertedWith("Already voted");
    });

    it("Should emit quorum reached event", async function () {
      const { ballot, voter1, voter2 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Test Election",
        description: "Test election description",
        voteType: 0,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      // First vote
      await ballot.connect(voter1).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64));

      // Second vote should trigger quorum
      await expect(ballot.connect(voter2).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64)))
        .to.emit(ballot, "QuorumReached")
        .withArgs(0, 2, 2);
    });

    it("Should handle whitelist correctly", async function () {
      const { ballot, owner, voter1, voter2 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Whitelist Election",
        description: "Whitelist test",
        voteType: 0,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 2,
        whitelistEnabled: true,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      // Whitelist voter1 only
      await ballot.whitelistVoters(0, [voter1.address], [1]);

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      // Voter1 should be able to vote
      await expect(ballot.connect(voter1).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64)))
        .to.not.be.reverted;

      // Voter2 should not be able to vote
      await expect(ballot.connect(voter2).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64)))
        .to.be.revertedWith("Not whitelisted");
    });

    it("Should end voting and prevent further votes", async function () {
      const { ballot, voter1 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Test Election",
        description: "Test election description",
        voteType: 0,
        startTime: currentTime + 60,
        endTime: currentTime + 3600,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      // Move to end time
      await time.increaseTo(config.endTime);
      await ballot.endVoting(0);

      // Try to vote after ending
      await expect(ballot.connect(voter1).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64)))
        .to.be.revertedWith("Voting not active");
    });
  });

  describe("FHEBallot - Weighted Voting", function () {
    it("Should handle weighted votes correctly", async function () {
      const { ballot, voter1 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Weighted Vote",
        description: "Weighted voting test",
        voteType: 2, // Weighted
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 5,
        whitelistEnabled: true,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      // Whitelist voter with weight 10
      await ballot.whitelistVoters(0, [voter1.address], [10]);

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      // Cast weighted vote
      await expect(ballot.connect(voter1).castWeightedVote(0, ethers.randomBytes(32), 5, ethers.randomBytes(64)))
        .to.emit(ballot, "VoteCast");

      const voterInfo = await ballot.getVoterInfo(0, voter1.address);
      expect(voterInfo.hasVoted).to.be.true;
      expect(voterInfo.votingPower).to.equal(10);
    });

    it("Should reject invalid weight", async function () {
      const { ballot, voter1 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Weighted Vote",
        description: "Weighted voting test",
        voteType: 2,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 5,
        whitelistEnabled: true,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);
      await ballot.whitelistVoters(0, [voter1.address], [10]);

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      // Try to vote with weight > voting power
      await expect(ballot.connect(voter1).castWeightedVote(0, ethers.randomBytes(32), 15, ethers.randomBytes(64)))
        .to.be.revertedWith("Invalid weight");
    });
  });

  describe("FHEQuadraticVoting", function () {
    it("Should create quadratic voting", async function () {
      const { quadraticVoting } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Quadratic Vote",
        description: "Quadratic voting test",
        voteType: 3, // Quadratic
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await expect(quadraticVoting.createVoting(
        config,
        ["Option A", "Option B", "Option C"],
        ["Desc A", "Desc B", "Desc C"]
      )).to.emit(quadraticVoting, "VotingCreated");
    });

    it("Should set default credits", async function () {
      const { quadraticVoting } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Quadratic Vote",
        description: "Quadratic voting test",
        voteType: 3,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 2,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await quadraticVoting.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);
      await quadraticVoting.setDefaultCredits(0, 100);

      // Check default credits
      const credits = await quadraticVoting.getVoterCredits(0, ethers.ZeroAddress);
      expect(credits).to.equal(100);
    });

    it("Should calculate quadratic cost correctly", async function () {
      const { quadraticVoting } = await loadFixture(deployVotingFixture);

      expect(await quadraticVoting.calculateQuadraticCost(1)).to.equal(1);
      expect(await quadraticVoting.calculateQuadraticCost(2)).to.equal(4);
      expect(await quadraticVoting.calculateQuadraticCost(3)).to.equal(9);
      expect(await quadraticVoting.calculateQuadraticCost(10)).to.equal(100);
    });

    it("Should cast quadratic votes", async function () {
      const { quadraticVoting, voter1 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Quadratic Vote",
        description: "Quadratic voting test",
        voteType: 3,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await quadraticVoting.createVoting(config, ["A", "B", "C"], ["Desc A", "Desc B", "Desc C"]);
      await quadraticVoting.setDefaultCredits(0, 100);

      await time.increaseTo(config.startTime);
      await quadraticVoting.startVoting(0);

      // Allocate credits: 25 to A (5 votes), 16 to B (4 votes), 9 to C (3 votes)
      const encryptedVotes = [
        ethers.randomBytes(32),
        ethers.randomBytes(32),
        ethers.randomBytes(32)
      ];
      const credits = [25, 16, 9]; // Total: 50 credits

      await expect(quadraticVoting.connect(voter1).castQuadraticVote(0, encryptedVotes, credits, ethers.randomBytes(64)))
        .to.emit(quadraticVoting, "QuadraticVoteAllocated")
        .withArgs(0, voter1.address, 50, await time.latest());
    });

    it("Should reject insufficient credits", async function () {
      const { quadraticVoting, voter1 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Quadratic Vote",
        description: "Quadratic voting test",
        voteType: 3,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await quadraticVoting.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);
      await quadraticVoting.setDefaultCredits(0, 50);

      await time.increaseTo(config.startTime);
      await quadraticVoting.startVoting(0);

      // Try to use more credits than available
      const encryptedVotes = [ethers.randomBytes(32), ethers.randomBytes(32)];
      const credits = [49, 25]; // Total: 74 credits (more than 50 available)

      await expect(quadraticVoting.connect(voter1).castQuadraticVote(0, encryptedVotes, credits, ethers.randomBytes(64)))
        .to.be.revertedWithCustomError(quadraticVoting, "InsufficientCredits");
    });

    it("Should allocate individual voter credits", async function () {
      const { quadraticVoting, voter1 } = await loadFixture(deployVotingFixture);

      const config = {
        name: "Quadratic Vote",
        description: "Quadratic voting test",
        voteType: 3,
        startTime: (await time.latest()) + 60,
        endTime: (await time.latest()) + 86400,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await quadraticVoting.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);
      
      // Allocate specific credits to voter1
      await expect(quadraticVoting.allocateCredits(0, voter1.address, 200))
        .to.emit(quadraticVoting, "CreditsAllocated")
        .withArgs(0, voter1.address, 200);

      const credits = await quadraticVoting.getVoterCredits(0, voter1.address);
      expect(credits).to.equal(200);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to create voting", async function () {
      const { ballot, voter1 } = await loadFixture(deployVotingFixture);

      const config = {
        name: "Test",
        description: "Test",
        voteType: 0,
        startTime: (await time.latest()) + 60,
        endTime: (await time.latest()) + 86400,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await expect(ballot.connect(voter1).createVoting(config, ["A"], ["Desc A"]))
        .to.be.revertedWithCustomError(ballot, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to whitelist voters", async function () {
      const { ballot, voter1, voter2 } = await loadFixture(deployVotingFixture);

      const config = {
        name: "Test",
        description: "Test",
        voteType: 0,
        startTime: (await time.latest()) + 60,
        endTime: (await time.latest()) + 86400,
        quorum: 1,
        whitelistEnabled: true,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      await expect(ballot.connect(voter1).whitelistVoters(0, [voter2.address], [1]))
        .to.be.revertedWithCustomError(ballot, "OwnableUnauthorizedAccount");
    });

    it("Should handle emergency pause", async function () {
      const { ballot, owner, voter1 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Test",
        description: "Test",
        voteType: 0,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      // Pause the contract
      await ballot.emergencyPause();

      // Try to vote while paused
      await expect(ballot.connect(voter1).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64)))
        .to.be.revertedWithCustomError(ballot, "EnforcedPause");

      // Unpause
      await ballot.emergencyUnpause();

      // Should be able to vote now
      await expect(ballot.connect(voter1).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64)))
        .to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return correct voting status", async function () {
      const { ballot } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Test",
        description: "Test",
        voteType: 0,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      expect(await ballot.getVotingStatus(0)).to.equal(0); // NotStarted

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);
      expect(await ballot.getVotingStatus(0)).to.equal(1); // Active

      await time.increaseTo(config.endTime);
      await ballot.endVoting(0);
      expect(await ballot.getVotingStatus(0)).to.equal(2); // Ended
    });

    it("Should return voting options", async function () {
      const { ballot } = await loadFixture(deployVotingFixture);

      const config = {
        name: "Test",
        description: "Test",
        voteType: 0,
        startTime: (await time.latest()) + 60,
        endTime: (await time.latest()) + 86400,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      const options = ["Option A", "Option B", "Option C"];
      const descriptions = ["Desc A", "Desc B", "Desc C"];

      await ballot.createVoting(config, options, descriptions);

      const retrievedOptions = await ballot.getVotingOptions(0);
      expect(retrievedOptions).to.deep.equal(options);
    });

    it("Should track total voters", async function () {
      const { ballot, voter1, voter2 } = await loadFixture(deployVotingFixture);

      const currentTime = await time.latest();
      const config = {
        name: "Test",
        description: "Test",
        voteType: 0,
        startTime: currentTime + 60,
        endTime: currentTime + 86400,
        quorum: 3,
        whitelistEnabled: false,
        maxVotersCount: 100
      };

      await ballot.createVoting(config, ["A", "B"], ["Desc A", "Desc B"]);

      await time.increaseTo(config.startTime);
      await ballot.startVoting(0);

      expect(await ballot.getTotalVoters(0)).to.equal(0);

      await ballot.connect(voter1).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64));
      expect(await ballot.getTotalVoters(0)).to.equal(1);

      await ballot.connect(voter2).castVote(0, ethers.randomBytes(32), ethers.randomBytes(64));
      expect(await ballot.getTotalVoters(0)).to.equal(2);
    });
  });
});