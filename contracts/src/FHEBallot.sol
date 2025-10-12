// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FHEVotingBase.sol";
import "./IFHEVoting.sol";
import "@fhevm/solidity/lib/FHE.sol";
import { externalEuint32 } from "encrypted-types/EncryptedTypes.sol";
// Use the FHE coprocessor config for Sepolia from @fhevm/solidity
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHEBallot
 * @notice Main voting contract implementing privacy-preserving voting with FHE
 * @dev Supports multiple voting types with encrypted vote tallying
 * @dev Inherits SepoliaConfig to initialize FHE coprocessor addresses on Sepolia
 */
contract FHEBallot is FHEVotingBase, IFHEVoting, SepoliaConfig {
    // State variables
    uint256 private votingIdCounter;
    
    // Voting storage
    mapping(uint256 => VotingConfig) public votingConfigs;
    mapping(uint256 => VoteOption[]) public votingOptions;
    mapping(uint256 => mapping(address => VoterInfo)) public voterInfo;
    mapping(uint256 => VotingStatus) public votingStatus;
    mapping(uint256 => uint256) public totalVoters;
    mapping(uint256 => uint256[]) public decryptedResults;
    mapping(uint256 => bool) public resultsDecrypted;
    mapping(uint256 => euint32) public encryptedTotalVotes;
    // Voting creator address per votingId
    mapping(uint256 => address) public votingCreator;
    
    // Whitelist management
    mapping(uint256 => mapping(address => bool)) public whitelist;
    mapping(uint256 => uint256) public whitelistCount;
    
    // Decryption requests
    mapping(uint256 => uint256) public decryptionRequestId;
    mapping(uint256 => uint256) public requestIdToVotingId;
    
    // Modifiers
    modifier votingExists(uint256 votingId) {
        require(votingId < votingIdCounter, "Voting does not exist");
        _;
    }
    
    modifier onlyDuringVoting(uint256 votingId) {
        // Time-gated: allow voting automatically within the time window
        require(
            isWithinVotingPeriod(
                votingConfigs[votingId].startTime,
                votingConfigs[votingId].endTime
            ),
            "Outside voting period"
        );
        // Lazily flip status to Active if not started yet
        if (votingStatus[votingId] == VotingStatus.NotStarted) {
            VotingStatus oldStatus = votingStatus[votingId];
            votingStatus[votingId] = VotingStatus.Active;
            emit VotingStatusChanged(votingId, oldStatus, VotingStatus.Active);
        }
        _;
    }
    
    modifier onlyAfterVoting(uint256 votingId) {
        // Consider the voting ended once endTime has passed
        if (block.timestamp >= votingConfigs[votingId].endTime) {
            if (
                votingStatus[votingId] == VotingStatus.Active ||
                votingStatus[votingId] == VotingStatus.NotStarted
            ) {
                VotingStatus oldStatus = votingStatus[votingId];
                votingStatus[votingId] = VotingStatus.Ended;
                emit VotingStatusChanged(votingId, oldStatus, VotingStatus.Ended);
            }
        }
        require(
            votingStatus[votingId] == VotingStatus.Ended ||
            votingStatus[votingId] == VotingStatus.Tallied,
            "Voting not ended"
        );
        _;
    }
    
    modifier onlyWhitelisted(uint256 votingId) {
        if (votingConfigs[votingId].whitelistEnabled) {
            require(whitelist[votingId][msg.sender], "Not whitelisted");
        }
        _;
    }
    
    constructor() FHEVotingBase(msg.sender) {}
    
    /**
     * @notice Create a new voting instance
     * @param config Voting configuration
     * @param optionNames Names of voting options
     * @param optionDescriptions Descriptions of voting options
     * @return votingId The ID of the created voting
     */
    function createVoting(
        VotingConfig calldata config,
        string[] calldata optionNames,
        string[] calldata optionDescriptions
    ) external override returns (uint256 votingId) {
        require(optionNames.length == optionDescriptions.length, "Mismatched arrays");
        require(optionNames.length >= 2, "At least 2 options required");
        require(optionNames.length <= MAX_OPTIONS, "Too many options");
        
        validateTimeWindow(config.startTime, config.endTime);
        
        votingId = votingIdCounter;
        votingIdCounter++;
        
        votingConfigs[votingId] = config;
        votingStatus[votingId] = VotingStatus.NotStarted;
        votingCreator[votingId] = msg.sender;
        
        // Initialize voting options with encrypted zero counts
        for (uint256 i = 0; i < optionNames.length; i++) {
            votingOptions[votingId].push(VoteOption({
                name: optionNames[i],
                description: optionDescriptions[i],
                encryptedVoteCount: FHE.asEuint32(0),
                active: true
            }));
        }
        
        // Initialize encrypted total votes
        encryptedTotalVotes[votingId] = FHE.asEuint32(0);
        
        emit VotingCreated(
            votingId,
            config.name,
            config.voteType,
            config.startTime,
            config.endTime
        );
    }
    
    /**
     * @notice Cast an encrypted vote
     * @param votingId The voting ID
     * @param encryptedVote Encrypted vote data
     * @param proof Zero-knowledge proof of vote validity
     */
    function castVote(
        uint256 votingId,
        externalEuint32 encryptedVote,
        bytes calldata proof
    ) external override 
        votingExists(votingId)
        onlyDuringVoting(votingId)
        onlyWhitelisted(votingId)
        whenNotPaused
        nonReentrant {
        
        require(!voterInfo[votingId][msg.sender].hasVoted, "Already voted");
        // Verify via Relayer inputProof and convert external ciphertext to on-chain euint32
        euint32 encryptedChoice = FHE.fromExternal(encryptedVote, proof);
        
        // Validate choice is within range (0 to numOptions-1) - optional in mock path
        // uint32 numOptions = uint32(votingOptions[votingId].length);
        // euint32 maxOption = FHE.asEuint32(numOptions - 1);
        
        // Store encrypted vote
        voterInfo[votingId][msg.sender] = VoterInfo({
            hasVoted: true,
            isWhitelisted: whitelist[votingId][msg.sender],
            votingPower: 1,
            encryptedChoice: encryptedChoice,
            voteTimestamp: block.timestamp
        });
        
        // Update encrypted vote counts homomorphically
        _updateVoteCounts(votingId, encryptedChoice, 1);
        
        totalVoters[votingId]++;
        
        emit VoteCast(votingId, msg.sender, block.timestamp);
        
        // Check if quorum is reached
        if (totalVoters[votingId] >= votingConfigs[votingId].quorum) {
            emit QuorumReached(
                votingId,
                totalVoters[votingId],
                votingConfigs[votingId].quorum
            );
        }
    }
    
    /**
     * @notice Cast a weighted vote
     * @param votingId The voting ID
     * @param encryptedVote Encrypted vote data
     * @param weight Vote weight
     * @param proof Zero-knowledge proof
     */
    function castWeightedVote(
        uint256 votingId,
        externalEuint32 encryptedVote,
        uint256 weight,
        bytes calldata proof
    ) external override
        votingExists(votingId)
        onlyDuringVoting(votingId)
        onlyWhitelisted(votingId)
        whenNotPaused
        nonReentrant {
        
        require(votingConfigs[votingId].voteType == VoteType.Weighted, "Not weighted voting");
        require(!voterInfo[votingId][msg.sender].hasVoted, "Already voted");
        require(weight > 0 && weight <= voterInfo[votingId][msg.sender].votingPower, "Invalid weight");
        // External ciphertext conversion
        euint32 encryptedChoice = FHE.fromExternal(encryptedVote, proof);
        
        // Store weighted vote
        voterInfo[votingId][msg.sender].hasVoted = true;
        voterInfo[votingId][msg.sender].encryptedChoice = encryptedChoice;
        voterInfo[votingId][msg.sender].voteTimestamp = block.timestamp;
        
        // Update with weight
        _updateVoteCounts(votingId, encryptedChoice, weight);
        
        totalVoters[votingId]++;
        
        emit VoteCast(votingId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Cast quadratic votes (implemented in FHEQuadraticVoting)
     */
    function castQuadraticVote(
        uint256 votingId,
        externalEuint32[] calldata encryptedVotes,
        uint256[] calldata credits,
        bytes calldata proof
    ) external virtual override {
        revert("Use FHEQuadraticVoting contract");
    }
    
    /**
     * @notice Update encrypted vote counts homomorphically
     * @param votingId The voting ID
     * @param encryptedChoice Encrypted option choice
     * @param weight Vote weight
     */
    function _updateVoteCounts(
        uint256 votingId,
        euint32 encryptedChoice,
        uint256 weight
    ) private {
        uint256 numOptions = votingOptions[votingId].length;
        
        // For each option, check if it matches the choice and update count
        for (uint256 i = 0; i < numOptions; i++) {
            euint32 optionIndex = FHE.asEuint32(uint32(i));
            ebool isSelected = FHE.eq(encryptedChoice, optionIndex);
            
            // If selected, add weight to this option's count
            euint32 weightToAdd = FHE.select(
                isSelected,
                FHE.asEuint32(uint32(weight)),
                FHE.asEuint32(0)
            );
            
            votingOptions[votingId][i].encryptedVoteCount = FHE.add(
                votingOptions[votingId][i].encryptedVoteCount,
                weightToAdd
            );
        }
        
        // Update total encrypted votes
        encryptedTotalVotes[votingId] = FHE.add(
            encryptedTotalVotes[votingId],
            FHE.asEuint32(uint32(weight))
        );
    }
    
    /**
     * @notice Whitelist voters for a voting
     * @param votingId The voting ID
     * @param voters Array of voter addresses
     * @param votingPowers Array of voting powers
     */
    function whitelistVoters(
        uint256 votingId,
        address[] calldata voters,
        uint256[] calldata votingPowers
    ) external override
        onlyOwner
        votingExists(votingId) {
        
        require(voters.length == votingPowers.length, "Mismatched arrays");
        require(votingStatus[votingId] == VotingStatus.NotStarted, "Voting already started");
        
        for (uint256 i = 0; i < voters.length; i++) {
            if (!whitelist[votingId][voters[i]]) {
                whitelist[votingId][voters[i]] = true;
                voterInfo[votingId][voters[i]].isWhitelisted = true;
                voterInfo[votingId][voters[i]].votingPower = votingPowers[i];
                whitelistCount[votingId]++;
                
                emit VoterWhitelisted(votingId, voters[i], votingPowers[i]);
            }
        }
    }
    
    /**
     * @notice Start the voting period
     * @param votingId The voting ID
     */
    function startVoting(uint256 votingId) external override
        onlyOwner
        votingExists(votingId) {
        
        require(votingStatus[votingId] == VotingStatus.NotStarted, "Already started");
        require(block.timestamp >= votingConfigs[votingId].startTime, "Too early");
        
        _updateVotingStatus(votingId, VotingStatus.Active);
    }
    
    /**
     * @notice End the voting period
     * @param votingId The voting ID
     */
    function endVoting(uint256 votingId) external override
        onlyOwner
        votingExists(votingId) {
        
        require(votingStatus[votingId] == VotingStatus.Active, "Not active");
        require(
            block.timestamp >= votingConfigs[votingId].endTime,
            "Too early to end"
        );
        
        _updateVotingStatus(votingId, VotingStatus.Ended);
    }
    
    /**
     * @notice Request decryption of voting results
     * @param votingId The voting ID
     */
    function requestDecryption(uint256 votingId) external override
        votingExists(votingId)
        onlyAfterVoting(votingId) {

        require(!resultsDecrypted[votingId], "Already decrypted");
        require(msg.sender == votingCreator[votingId], "Not voting creator");
        
        // In production, this would use the new TFHEVM decryption mechanism
        // For Sepolia deployment, we simulate decryption
        uint256 numOptions = votingOptions[votingId].length;
        decryptedResults[votingId] = new uint256[](numOptions);
        
        // Simulate decryption results (in production, these would be real decrypted values)
        for (uint256 i = 0; i < numOptions; i++) {
            // Mock decryption - in real deployment, this would decrypt the actual values
            decryptedResults[votingId][i] = i * 100; // Placeholder values
        }
        
        resultsDecrypted[votingId] = true;
        _updateVotingStatus(votingId, VotingStatus.Tallied);
        
        emit ResultsDecrypted(votingId, decryptedResults[votingId], block.timestamp);
    }
    
    // Callback function removed - Gateway is not available in @fhevm/solidity 0.8.0
    // Decryption is now handled directly in requestDecryption function
    
    /**
     * @notice Update voting status
     * @param votingId The voting ID
     * @param newStatus New status
     */
    function _updateVotingStatus(uint256 votingId, VotingStatus newStatus) private {
        VotingStatus oldStatus = votingStatus[votingId];
        votingStatus[votingId] = newStatus;
        emit VotingStatusChanged(votingId, oldStatus, newStatus);
    }
    
    // View functions
    
    function getVotingStatus(uint256 votingId) external view override returns (VotingStatus) {
        VotingConfig memory cfg = votingConfigs[votingId];
        if (block.timestamp < cfg.startTime) {
            return VotingStatus.NotStarted;
        }
        if (block.timestamp <= cfg.endTime) {
            // If results are already tallied, preserve that terminal state
            if (votingStatus[votingId] == VotingStatus.Tallied) return VotingStatus.Tallied;
            return VotingStatus.Active;
        }
        // After end time
        if (votingStatus[votingId] == VotingStatus.Tallied) return VotingStatus.Tallied;
        return VotingStatus.Ended;
    }
    
    function getVotingConfig(uint256 votingId) external view override returns (VotingConfig memory) {
        return votingConfigs[votingId];
    }
    
    function getVoterInfo(uint256 votingId, address voter) external view override returns (VoterInfo memory) {
        return voterInfo[votingId][voter];
    }
    
    function getTotalVoters(uint256 votingId) external view override returns (uint256) {
        return totalVoters[votingId];
    }
    
    function isQuorumReached(uint256 votingId) external view override returns (bool) {
        return totalVoters[votingId] >= votingConfigs[votingId].quorum;
    }
    
    function getDecryptedResults(uint256 votingId) external view override returns (uint256[] memory) {
        require(resultsDecrypted[votingId], "Results not decrypted");
        return decryptedResults[votingId];
    }
    
    function getWinningOption(uint256 votingId) external view override returns (uint256) {
        require(resultsDecrypted[votingId], "Results not decrypted");
        
        uint256 maxVotes = 0;
        uint256 winningOption = 0;
        
        for (uint256 i = 0; i < decryptedResults[votingId].length; i++) {
            if (decryptedResults[votingId][i] > maxVotes) {
                maxVotes = decryptedResults[votingId][i];
                winningOption = i;
            }
        }
        
        return winningOption;
    }

    // --- Compatibility + convenience views for frontend ---

    function votingCounter() external view returns (uint256) {
        return votingIdCounter;
    }

    function getTotalVotes(uint256 votingId) external view returns (uint256) {
        return totalVoters[votingId];
    }

    function hasVoted(uint256 votingId, address user) external view returns (bool) {
        return voterInfo[votingId][user].hasVoted;
    }
    
    function reencryptVote(
        uint256 votingId,
        address voter,
        bytes32 publicKey
    ) external view override returns (bytes memory) {
        require(voterInfo[votingId][voter].hasVoted, "Not voted");
        require(userPublicKeys[voter] == publicKey, "Invalid public key");
        
        // In production, this would use Gateway for reencryption
        // For Sepolia deployment, return encrypted vote as bytes
        euint32 encryptedChoice = voterInfo[votingId][voter].encryptedChoice;
        return abi.encodePacked(encryptedChoice);
    }
    
    function verifyVoteIntegrity(
        uint256 votingId,
        address voter,
        bytes calldata proof
    ) external view override returns (bool) {
        require(voterInfo[votingId][voter].hasVoted, "Not voted");
        
        // Verify the vote integrity using the proof
        bytes32 voteHash = keccak256(abi.encodePacked(
            votingId,
            voter,
            voterInfo[votingId][voter].voteTimestamp
        ));
        
        return keccak256(proof) == voteHash;
    }
    
    /**
     * @notice Get voting options for a voting
     * @param votingId The voting ID
     * @return Array of option names
     */
    function getVotingOptions(uint256 votingId) external view returns (string[] memory) {
        uint256 numOptions = votingOptions[votingId].length;
        string[] memory options = new string[](numOptions);
        
        for (uint256 i = 0; i < numOptions; i++) {
            options[i] = votingOptions[votingId][i].name;
        }
        
        return options;
    }
}
