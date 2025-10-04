// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhevm/solidity/lib/FHE.sol";
import { externalEuint32 } from "encrypted-types/EncryptedTypes.sol";

/**
 * @title IFHEVoting
 * @notice Interface for FHE-enabled voting contracts
 * @dev Defines the standard interface for privacy-preserving voting using Fully Homomorphic Encryption
 */
interface IFHEVoting {
    // Enums
    enum VotingStatus {
        NotStarted,
        Active,
        Ended,
        Tallied
    }

    enum VoteType {
        SingleChoice,
        MultiChoice,
        Weighted,
        Quadratic
    }

    // Structs
    struct VotingConfig {
        string name;
        string description;
        VoteType voteType;
        uint256 startTime;
        uint256 endTime;
        uint256 quorum;
        bool whitelistEnabled;
        uint256 maxVotersCount;
    }

    struct VoteOption {
        string name;
        string description;
        euint32 encryptedVoteCount;
        bool active;
    }

    struct VoterInfo {
        bool hasVoted;
        bool isWhitelisted;
        uint256 votingPower;
        euint32 encryptedChoice;
        uint256 voteTimestamp;
    }

    // Events
    event VotingCreated(
        uint256 indexed votingId,
        string name,
        VoteType voteType,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed votingId,
        address indexed voter,
        uint256 timestamp
    );

    event VoterWhitelisted(
        uint256 indexed votingId,
        address indexed voter,
        uint256 votingPower
    );

    event VotingStatusChanged(
        uint256 indexed votingId,
        VotingStatus oldStatus,
        VotingStatus newStatus
    );

    event ResultsDecrypted(
        uint256 indexed votingId,
        uint256[] results,
        uint256 totalVotes
    );

    event QuorumReached(
        uint256 indexed votingId,
        uint256 totalVotes,
        uint256 quorum
    );

    // Core voting functions
    function castVote(
        uint256 votingId,
        externalEuint32 encryptedVote,
        bytes calldata proof
    ) external;

    function castWeightedVote(
        uint256 votingId,
        externalEuint32 encryptedVote,
        uint256 weight,
        bytes calldata proof
    ) external;

    function castQuadraticVote(
        uint256 votingId,
        externalEuint32[] calldata encryptedVotes,
        uint256[] calldata credits,
        bytes calldata proof
    ) external;

    // Administration functions
    function createVoting(
        VotingConfig calldata config,
        string[] calldata optionNames,
        string[] calldata optionDescriptions
    ) external returns (uint256 votingId);

    function whitelistVoters(
        uint256 votingId,
        address[] calldata voters,
        uint256[] calldata votingPowers
    ) external;

    function startVoting(uint256 votingId) external;
    function endVoting(uint256 votingId) external;

    // View functions
    function getVotingStatus(uint256 votingId) external view returns (VotingStatus);
    function getVotingConfig(uint256 votingId) external view returns (VotingConfig memory);
    function getVoterInfo(uint256 votingId, address voter) external view returns (VoterInfo memory);
    function getTotalVoters(uint256 votingId) external view returns (uint256);
    function isQuorumReached(uint256 votingId) external view returns (bool);
    
    // Result functions
    function requestDecryption(uint256 votingId) external;
    function getDecryptedResults(uint256 votingId) external view returns (uint256[] memory);
    function getWinningOption(uint256 votingId) external view returns (uint256);
    
    // FHE specific functions
    function reencryptVote(
        uint256 votingId,
        address voter,
        bytes32 publicKey
    ) external view returns (bytes memory);
    
    function verifyVoteIntegrity(
        uint256 votingId,
        address voter,
        bytes calldata proof
    ) external view returns (bool);
}

/**
 * @title IFHEQuadraticVoting
 * @notice Extended interface for quadratic voting functionality
 */
interface IFHEQuadraticVoting is IFHEVoting {
    struct QuadraticVoteAllocation {
        euint32 encryptedCredits;
        euint32[] encryptedAllocations;
        uint256 totalCreditsUsed;
    }

    event CreditsAllocated(
        uint256 indexed votingId,
        address indexed voter,
        uint256 creditsUsed
    );

    function allocateCredits(
        uint256 votingId,
        address voter,
        uint256 credits
    ) external;

    function getVoterCredits(
        uint256 votingId,
        address voter
    ) external view returns (uint256);

    function calculateQuadraticCost(uint256 votes) external pure returns (uint256);
}

/**
 * @title IFHEGovernance
 * @notice Interface for governance-specific voting features
 */
interface IFHEGovernance {
    struct Proposal {
        uint256 id;
        address proposer;
        string ipfsHash;
        uint256 votingId;
        bool executed;
        uint256 executionTime;
        bytes callData;
        address target;
    }

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 votingId,
        string ipfsHash
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        bool success
    );

    function createProposal(
        string calldata ipfsHash,
        address target,
        bytes calldata callData,
        IFHEVoting.VotingConfig calldata votingConfig
    ) external returns (uint256 proposalId);

    function executeProposal(uint256 proposalId) external;
    function cancelProposal(uint256 proposalId) external;
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
}
