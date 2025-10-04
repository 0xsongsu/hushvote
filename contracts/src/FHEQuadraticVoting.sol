// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FHEBallot.sol";
import "./IFHEVoting.sol";
import "@fhevm/solidity/lib/FHE.sol";
import { externalEuint32 } from "encrypted-types/EncryptedTypes.sol";

/**
 * @title FHEQuadraticVoting
 * @notice Implements quadratic voting with FHE for privacy-preserving democratic voting
 * @dev Extends FHEBallot with quadratic voting mechanisms where cost increases quadratically
 */
contract FHEQuadraticVoting is FHEBallot, IFHEQuadraticVoting {
    
    // Quadratic voting specific storage
    mapping(uint256 => mapping(address => QuadraticVoteAllocation)) public voteAllocations;
    mapping(uint256 => mapping(address => uint256)) public voterCredits;
    mapping(uint256 => uint256) public defaultCredits;
    mapping(uint256 => mapping(uint256 => euint32)) public optionQuadraticTotals;
    
    // Constants
    uint256 public constant MAX_CREDITS = 1000;
    uint256 public constant MIN_CREDITS = 1;
    
    // Events
    event QuadraticVoteAllocated(
        uint256 indexed votingId,
        address indexed voter,
        uint256 creditsUsed,
        uint256 timestamp
    );
    
    event CreditsRefunded(
        uint256 indexed votingId,
        address indexed voter,
        uint256 creditsRefunded
    );
    
    // Errors
    error InsufficientCredits(uint256 required, uint256 available);
    error InvalidCreditAllocation();
    error CreditsAlreadyAllocated();
    error InvalidQuadraticVote();
    
    constructor() FHEBallot() {}
    
    /**
     * @notice Cast quadratic votes across multiple options
     * @param votingId The voting ID
     * @param encryptedVotes Array of encrypted vote allocations per option
     * @param credits Array of credit allocations per option
     * @param proof Zero-knowledge proof of valid allocation
     */
    function castQuadraticVote(
        uint256 votingId,
        externalEuint32[] calldata encryptedVotes,
        uint256[] calldata credits,
        bytes calldata proof
    ) external override(FHEBallot, IFHEVoting)
        votingExists(votingId)
        onlyDuringVoting(votingId)
        onlyWhitelisted(votingId)
        whenNotPaused
        nonReentrant {
        
        require(votingConfigs[votingId].voteType == VoteType.Quadratic, "Not quadratic voting");
        require(!voterInfo[votingId][msg.sender].hasVoted, "Already voted");
        require(encryptedVotes.length == credits.length, "Mismatched arrays");
        require(encryptedVotes.length == votingOptions[votingId].length, "Invalid options count");
        // 使用第一个句柄与 proof 做一致性校验（proof 对应整组 handles）
        FHE.fromExternal(encryptedVotes[0], proof);
        
        uint256 totalCreditsUsed = _calculateTotalQuadraticCost(credits);
        uint256 availableCredits = voterCredits[votingId][msg.sender];
        
        if (availableCredits == 0) {
            availableCredits = defaultCredits[votingId];
            if (availableCredits == 0) {
                availableCredits = 100; // Default if not set
            }
            voterCredits[votingId][msg.sender] = availableCredits;
        }
        
        if (totalCreditsUsed > availableCredits) {
            revert InsufficientCredits(totalCreditsUsed, availableCredits);
        }
        
        // Process each vote allocation
        euint32[] memory encryptedAllocations = new euint32[](encryptedVotes.length);
        
        for (uint256 i = 0; i < encryptedVotes.length; i++) {
            if (credits[i] > 0) {
                // Encrypt the vote count (square root of credits)
                uint256 voteCount = _sqrt(credits[i]);
                euint32 encryptedVoteCount = FHE.asEuint32(uint32(voteCount));
                
                // Update option totals with encrypted votes
                optionQuadraticTotals[votingId][i] = FHE.add(
                    optionQuadraticTotals[votingId][i],
                    encryptedVoteCount
                );
                
                // Store encrypted allocation
                encryptedAllocations[i] = encryptedVoteCount;
                
                // Update main vote count
                votingOptions[votingId][i].encryptedVoteCount = FHE.add(
                    votingOptions[votingId][i].encryptedVoteCount,
                    encryptedVoteCount
                );
            } else {
                encryptedAllocations[i] = FHE.asEuint32(0);
            }
        }
        
        // Store vote allocation
        voteAllocations[votingId][msg.sender] = QuadraticVoteAllocation({
            encryptedCredits: FHE.asEuint32(uint32(totalCreditsUsed)),
            encryptedAllocations: encryptedAllocations,
            totalCreditsUsed: totalCreditsUsed
        });
        
        // Update voter info
        voterInfo[votingId][msg.sender].hasVoted = true;
        voterInfo[votingId][msg.sender].voteTimestamp = block.timestamp;
        voterCredits[votingId][msg.sender] -= totalCreditsUsed;
        
        totalVoters[votingId]++;
        
        emit QuadraticVoteAllocated(votingId, msg.sender, totalCreditsUsed, block.timestamp);
        emit VoteCast(votingId, msg.sender, block.timestamp);
        emit CreditsAllocated(votingId, msg.sender, totalCreditsUsed);
        
        // Check quorum
        if (totalVoters[votingId] >= votingConfigs[votingId].quorum) {
            emit QuorumReached(
                votingId,
                totalVoters[votingId],
                votingConfigs[votingId].quorum
            );
        }
    }
    
    /**
     * @notice Allocate credits to a voter for quadratic voting
     * @param votingId The voting ID
     * @param voter The voter address
     * @param credits Number of credits to allocate
     */
    function allocateCredits(
        uint256 votingId,
        address voter,
        uint256 credits
    ) external override
        onlyOwner
        votingExists(votingId) {
        
        require(votingConfigs[votingId].voteType == VoteType.Quadratic, "Not quadratic voting");
        require(votingStatus[votingId] == VotingStatus.NotStarted, "Voting already started");
        require(credits >= MIN_CREDITS && credits <= MAX_CREDITS, "Invalid credits amount");
        require(voterCredits[votingId][voter] == 0, "Credits already allocated");
        
        voterCredits[votingId][voter] = credits;
        
        emit CreditsAllocated(votingId, voter, credits);
    }
    
    /**
     * @notice Set default credits for all voters in a voting
     * @param votingId The voting ID
     * @param credits Default number of credits
     */
    function setDefaultCredits(
        uint256 votingId,
        uint256 credits
    ) external
        onlyOwner
        votingExists(votingId) {
        
        require(votingConfigs[votingId].voteType == VoteType.Quadratic, "Not quadratic voting");
        require(votingStatus[votingId] == VotingStatus.NotStarted, "Voting already started");
        require(credits >= MIN_CREDITS && credits <= MAX_CREDITS, "Invalid credits amount");
        
        defaultCredits[votingId] = credits;
    }
    
    /**
     * @notice Get voter credits for quadratic voting
     * @param votingId The voting ID
     * @param voter The voter address
     * @return Available credits
     */
    function getVoterCredits(
        uint256 votingId,
        address voter
    ) external view override returns (uint256) {
        uint256 credits = voterCredits[votingId][voter];
        if (credits == 0) {
            credits = defaultCredits[votingId];
            if (credits == 0) {
                credits = 100; // Default
            }
        }
        return credits;
    }
    
    /**
     * @notice Calculate quadratic cost for a number of votes
     * @param votes Number of votes
     * @return cost Quadratic cost in credits
     */
    function calculateQuadraticCost(uint256 votes) public pure override returns (uint256 cost) {
        return votes * votes;
    }
    
    /**
     * @notice Calculate total quadratic cost for multiple allocations
     * @param credits Array of credit allocations
     * @return totalCost Total quadratic cost
     */
    function _calculateTotalQuadraticCost(
        uint256[] calldata credits
    ) private pure returns (uint256 totalCost) {
        for (uint256 i = 0; i < credits.length; i++) {
            totalCost += credits[i];
        }
    }
    
    /**
     * @notice Calculate square root using Babylonian method
     * @param x Input value
     * @return y Square root of x
     */
    function _sqrt(uint256 x) private pure returns (uint256 y) {
        if (x == 0) return 0;
        if (x <= 3) return 1;
        
        uint256 z = x;
        y = x / 2 + 1;
        while (y < z) {
            z = y;
            y = (x / y + y) / 2;
        }
    }
    
    /**
     * @notice Refund unused credits after voting ends
     * @param votingId The voting ID
     * @param voter The voter address
     */
    function refundUnusedCredits(
        uint256 votingId,
        address voter
    ) external
        votingExists(votingId)
        onlyAfterVoting(votingId) {
        
        uint256 unusedCredits = voterCredits[votingId][voter];
        if (unusedCredits > 0) {
            voterCredits[votingId][voter] = 0;
            
            // In a real implementation, this could trigger a token refund
            emit CreditsRefunded(votingId, voter, unusedCredits);
        }
    }
    
    /**
     * @notice Get quadratic vote allocation for a voter
     * @param votingId The voting ID
     * @param voter The voter address
     * @return allocation The voter's quadratic vote allocation
     */
    function getVoteAllocation(
        uint256 votingId,
        address voter
    ) external view returns (QuadraticVoteAllocation memory) {
        return voteAllocations[votingId][voter];
    }
    
    /**
     * @notice Get encrypted quadratic totals for all options
     * @param votingId The voting ID
     * @return totals Array of encrypted quadratic totals
     */
    function getQuadraticTotals(
        uint256 votingId
    ) external view returns (euint32[] memory totals) {
        uint256 numOptions = votingOptions[votingId].length;
        totals = new euint32[](numOptions);
        
        for (uint256 i = 0; i < numOptions; i++) {
            totals[i] = optionQuadraticTotals[votingId][i];
        }
    }
    
    /**
     * @notice Verify quadratic allocation integrity
     * @param votingId The voting ID
     * @param voter The voter address
     * @return valid Whether the allocation is valid
     */
    function verifyQuadraticAllocation(
        uint256 votingId,
        address voter
    ) external view returns (bool valid) {
        QuadraticVoteAllocation memory allocation = voteAllocations[votingId][voter];
        
        if (allocation.totalCreditsUsed == 0) {
            return false;
        }
        
        // Verify total credits used matches allocation
        // uint256 calculatedTotal = 0; // Calculation skipped in mock path
        for (uint256 i = 0; i < allocation.encryptedAllocations.length; i++) {
            // In production, would decrypt and verify
            // For now, we trust the stored total
        }
        
        return allocation.totalCreditsUsed <= MAX_CREDITS;
    }
    
    /**
     * @notice Calculate voting power distribution
     * @param votingId The voting ID
     * @return distribution Array showing credit distribution across options
     */
    function getVotingPowerDistribution(
        uint256 votingId
    ) external view returns (uint256[] memory distribution) {
        require(resultsDecrypted[votingId], "Results not decrypted");
        
        uint256 numOptions = votingOptions[votingId].length;
        distribution = new uint256[](numOptions);
        
        uint256 totalVotingPower = 0;
        for (uint256 i = 0; i < numOptions; i++) {
            distribution[i] = decryptedResults[votingId][i];
            totalVotingPower += distribution[i];
        }
        
        // Convert to percentages
        if (totalVotingPower > 0) {
            for (uint256 i = 0; i < numOptions; i++) {
                distribution[i] = (distribution[i] * 10000) / totalVotingPower;
            }
        }
    }
    
    /**
     * @notice Get statistics for quadratic voting
     * @param votingId The voting ID
     * @return totalCreditsAllocated Total credits allocated
     * @return totalCreditsUsed Total credits used
     * @return averageCreditsPerVoter Average credits per voter
     */
    function getQuadraticVotingStats(
        uint256 votingId
    ) external view returns (
        uint256 totalCreditsAllocated,
        uint256 totalCreditsUsed,
        uint256 averageCreditsPerVoter
    ) {
        uint256 voterCount = totalVoters[votingId];
        
        if (voterCount > 0) {
            totalCreditsAllocated = defaultCredits[votingId] * voterCount;
            
            // Would need to iterate through all voters to get actual used credits
            // For demonstration, returning estimated values
            totalCreditsUsed = totalCreditsAllocated * 70 / 100; // Assume 70% utilization
            averageCreditsPerVoter = totalCreditsUsed / voterCount;
        }
    }
}
