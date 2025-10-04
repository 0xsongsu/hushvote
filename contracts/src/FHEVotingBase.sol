// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhevm/solidity/lib/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FHEVotingBase
 * @notice Base contract providing FHE utilities and common functionality for voting contracts
 * @dev Implements core FHE operations, access control, and security features
 */
abstract contract FHEVotingBase is Ownable, ReentrancyGuard, Pausable {
    constructor(address initialOwner) Ownable(initialOwner) {}
    // Constants
    uint256 public constant MAX_OPTIONS = 100;
    uint256 public constant MAX_VOTERS = 10000;
    uint256 public constant MIN_VOTING_DURATION = 1 hours;
    uint256 public constant MAX_VOTING_DURATION = 365 days;
    
    // FHE-specific storage
    mapping(address => bytes32) public userPublicKeys;
    mapping(bytes32 => bool) public validProofs;
    
    // Events
    event PublicKeyRegistered(address indexed user, bytes32 publicKey);
    event ProofVerified(bytes32 indexed proofHash, bool valid);
    event FHEOperationExecuted(string operation, uint256 gasUsed);
    
    // Errors
    error InvalidPublicKey();
    error InvalidProof();
    error FHEOperationFailed(string reason);
    error InvalidEncryptedValue();
    error DecryptionNotAuthorized();
    error InvalidTimeWindow();
    
    /**
     * @notice Register a user's public key for reencryption
     * @param publicKey The user's public key for FHE operations
     */
    function registerPublicKey(bytes32 publicKey) external {
        if (publicKey == bytes32(0)) revert InvalidPublicKey();
        userPublicKeys[msg.sender] = publicKey;
        emit PublicKeyRegistered(msg.sender, publicKey);
    }
    
    /**
     * @notice Perform homomorphic addition of two encrypted values
     * @param a First encrypted value
     * @param b Second encrypted value
     * @return Result of homomorphic addition
     */
    function addEncrypted(euint32 a, euint32 b) internal returns (euint32) {
        return FHE.add(a, b);
    }
    
    /**
     * @notice Perform homomorphic subtraction
     * @param a First encrypted value
     * @param b Second encrypted value
     * @return Result of homomorphic subtraction
     */
    function subEncrypted(euint32 a, euint32 b) internal returns (euint32) {
        return FHE.sub(a, b);
    }
    
    /**
     * @notice Perform homomorphic multiplication
     * @param a Encrypted value
     * @param b Plain value to multiply by
     * @return Result of homomorphic multiplication
     */
    function mulEncrypted(euint32 a, uint32 b) internal returns (euint32) {
        return FHE.mul(a, b);
    }
    
    /**
     * @notice Compare two encrypted values
     * @param a First encrypted value
     * @param b Second encrypted value
     * @return Encrypted boolean result of comparison (a > b)
     */
    function gtEncrypted(euint32 a, euint32 b) internal returns (ebool) {
        return FHE.gt(a, b);
    }
    
    /**
     * @notice Compare two encrypted values for equality
     * @param a First encrypted value
     * @param b Second encrypted value
     * @return Encrypted boolean result of comparison (a == b)
     */
    function eqEncrypted(euint32 a, euint32 b) internal returns (ebool) {
        return FHE.eq(a, b);
    }
    
    /**
     * @notice Select between two encrypted values based on condition
     * @param condition Encrypted boolean condition
     * @param a Value to return if condition is true
     * @param b Value to return if condition is false
     * @return Selected encrypted value
     */
    function selectEncrypted(ebool condition, euint32 a, euint32 b) internal returns (euint32) {
        return FHE.select(condition, a, b);
    }
    
    /**
     * @notice Convert plaintext to encrypted value
     * @param value Plaintext value to encrypt
     * @return Encrypted value
     */
    function encryptValue(uint32 value) internal returns (euint32) {
        return FHE.asEuint32(value);
    }
    
    /**
     * @notice Verify zero-knowledge proof for encrypted vote
     * @param encryptedVote The encrypted vote data
     * @param proof The zero-knowledge proof
     * @return Whether the proof is valid
     */
    function verifyVoteProof(
        bytes calldata encryptedVote,
        bytes calldata proof
    ) internal returns (bool) {
        if (encryptedVote.length == 0 || proof.length == 0) {
            revert InvalidProof();
        }
        
        // Calculate proof hash
        bytes32 proofHash = keccak256(abi.encodePacked(encryptedVote, proof, msg.sender));
        
        // Check if proof was already used (prevent replay)
        if (validProofs[proofHash]) {
            revert InvalidProof();
        }
        
        // In production, implement actual ZK proof verification
        // For now, we do basic validation
        bool isValid = proof.length >= 64 && encryptedVote.length >= 32;
        
        if (isValid) {
            validProofs[proofHash] = true;
            emit ProofVerified(proofHash, true);
        }
        
        return isValid;
    }
    
    // Gateway functions removed - not available in @fhevm/solidity 0.8.0
    // In production, decryption would be handled through the new TFHEVM infrastructure
    
    /**
     * @notice Batch encrypt multiple values
     * @param values Array of plaintext values
     * @return encryptedValues Array of encrypted values
     */
    function batchEncrypt(
        uint32[] calldata values
    ) internal returns (euint32[] memory encryptedValues) {
        encryptedValues = new euint32[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            encryptedValues[i] = FHE.asEuint32(values[i]);
        }
    }
    
    /**
     * @notice Aggregate encrypted votes
     * @param votes Array of encrypted votes
     * @return Total aggregated encrypted value
     */
    function aggregateEncryptedVotes(
        euint32[] memory votes
    ) internal returns (euint32) {
        if (votes.length == 0) {
            return FHE.asEuint32(0);
        }
        
        euint32 total = votes[0];
        for (uint256 i = 1; i < votes.length; i++) {
            total = FHE.add(total, votes[i]);
        }
        return total;
    }
    
    /**
     * @notice Check if value is within encrypted range
     * @param value Encrypted value to check
     * @param min Minimum value (encrypted)
     * @param max Maximum value (encrypted)
     * @return Whether value is within range
     */
    function isInEncryptedRange(
        euint32 value,
        euint32 min,
        euint32 max
    ) internal returns (ebool) {
        ebool geMin = FHE.ge(value, min);
        ebool leMax = FHE.le(value, max);
        return FHE.and(geMin, leMax);
    }
    
    /**
     * @notice Validate time window for voting
     * @param startTime Start time of the voting period
     * @param endTime End time of the voting period
     */
    function validateTimeWindow(
        uint256 startTime,
        uint256 endTime
    ) internal view {
        if (startTime >= endTime) revert InvalidTimeWindow();
        if (endTime - startTime < MIN_VOTING_DURATION) revert InvalidTimeWindow();
        if (endTime - startTime > MAX_VOTING_DURATION) revert InvalidTimeWindow();
        if (startTime < block.timestamp) revert InvalidTimeWindow();
    }
    
    /**
     * @notice Check if current time is within voting period
     * @param startTime Start time of the voting period
     * @param endTime End time of the voting period
     * @return Whether current time is within voting period
     */
    function isWithinVotingPeriod(
        uint256 startTime,
        uint256 endTime
    ) internal view returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }
    
    /**
     * @notice Emergency pause function
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Resume from emergency pause
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Get the current block timestamp
     * @return Current timestamp
     */
    function getCurrentTimestamp() internal view returns (uint256) {
        return block.timestamp;
    }
    
    /**
     * @notice Modifier to check if caller has registered public key
     */
    modifier hasRegisteredKey() {
        if (userPublicKeys[msg.sender] == bytes32(0)) {
            revert InvalidPublicKey();
        }
        _;
    }
    
    /**
     * @notice Modifier to check if operation is within time bounds
     */
    modifier withinTime(uint256 startTime, uint256 endTime) {
        if (!isWithinVotingPeriod(startTime, endTime)) {
            revert InvalidTimeWindow();
        }
        _;
    }
}