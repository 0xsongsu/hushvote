# FHE Voting Platform - API Specification

## Smart Contract Interfaces

### FHEVotingFactory.sol

```solidity
interface IFHEVotingFactory {
    // Events
    event BallotCreated(address indexed ballot, address indexed creator, uint256 endTime);
    event QuadraticVotingEnabled(address indexed ballot);
    
    // State Variables
    mapping(address => address[]) public userBallots;
    address[] public allBallots;
    
    // Functions
    function createBallot(
        string memory title,
        string[] memory options,
        uint256 duration,
        bool isQuadratic
    ) external returns (address);
    
    function getBallotsByCreator(address creator) external view returns (address[] memory);
    function getAllBallots() external view returns (address[] memory);
    function getBallotDetails(address ballot) external view returns (BallotInfo memory);
}
```

### FHEBallot.sol

```solidity
interface IFHEBallot {
    // Events
    event VoteCast(address indexed voter, bytes32 encryptedVoteHash);
    event VotingEnded(uint256 timestamp);
    event ResultsRevealed(uint256[] results);
    
    // Encrypted State Variables
    struct EncryptedVote {
        euint32 choice;
        euint32 weight;
        ebool isValid;
    }
    
    // Functions
    function castVote(bytes calldata encryptedChoice) external;
    function castQuadraticVote(bytes calldata encryptedChoice, uint256 credits) external;
    function delegateVote(address delegatee) external;
    function getTotalVotes() external view returns (euint32);
    function getEncryptedResults() external view returns (euint32[] memory);
    function revealResults() external returns (uint256[] memory);
    function getVotingEndTime() external view returns (uint256);
    function hasVoted(address voter) external view returns (bool);
}
```

### QuadraticVoting.sol

```solidity
interface IQuadraticVoting {
    // Functions
    function calculateVoteCost(uint256 votes) external pure returns (uint256);
    function validateQuadraticVote(
        address voter,
        euint32 encryptedVotes,
        uint256 credits
    ) external view returns (ebool);
    function aggregateQuadraticVotes(
        euint32[] memory votes
    ) external view returns (euint32);
}
```

## Frontend API Endpoints

### Base Configuration
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
```

### Voting Endpoints

#### Submit Vote
```typescript
POST /api/vote/submit
Content-Type: application/json

Request:
{
  "ballotAddress": "0x...",
  "encryptedVote": "0x...",
  "signature": "0x...",
  "voterAddress": "0x...",
  "votingPower": 100,
  "nonce": "123456"
}

Response:
{
  "success": true,
  "transactionHash": "0x...",
  "blockNumber": 12345,
  "encryptedConfirmation": "0x...",
  "timestamp": 1234567890
}
```

#### Get Vote Status
```typescript
GET /api/vote/status/:transactionHash

Response:
{
  "status": "confirmed",
  "blockConfirmations": 12,
  "voter": "0x...",
  "ballot": "0x...",
  "timestamp": 1234567890,
  "gasUsed": "150000"
}
```

#### Get Ballot Results
```typescript
GET /api/ballot/:address/results

Response:
{
  "ballotAddress": "0x...",
  "isRevealed": false,
  "encryptedTallies": ["0x...", "0x..."],
  "totalVotes": "encrypted:0x...",
  "endTime": 1234567890,
  "revealTime": 1234567900
}
```

### Proposal Management

#### Create Proposal
```typescript
POST /api/proposal/create
Content-Type: application/json

Request:
{
  "title": "Proposal Title",
  "description": "Detailed description",
  "options": ["Yes", "No", "Abstain"],
  "duration": 604800,
  "quorumRequired": 1000,
  "isQuadratic": true,
  "metadata": {
    "category": "governance",
    "ipfsHash": "Qm..."
  }
}

Response:
{
  "success": true,
  "proposalId": "prop_123",
  "ballotAddress": "0x...",
  "transactionHash": "0x...",
  "estimatedGas": "500000"
}
```

#### Get Proposal Details
```typescript
GET /api/proposal/:id

Response:
{
  "id": "prop_123",
  "title": "Proposal Title",
  "description": "...",
  "ballotAddress": "0x...",
  "creator": "0x...",
  "startTime": 1234567890,
  "endTime": 1234567900,
  "status": "active",
  "options": [
    {
      "id": 0,
      "name": "Yes",
      "encryptedVotes": "0x..."
    }
  ],
  "participation": {
    "totalEligible": 10000,
    "totalVoted": "encrypted:0x...",
    "quorumReached": "encrypted:boolean"
  }
}
```

### Governance Operations

#### Delegate Vote
```typescript
POST /api/governance/delegate
Content-Type: application/json

Request:
{
  "delegator": "0x...",
  "delegatee": "0x...",
  "ballotAddress": "0x...",
  "signature": "0x..."
}

Response:
{
  "success": true,
  "transactionHash": "0x...",
  "delegation": {
    "from": "0x...",
    "to": "0x...",
    "votingPower": 100,
    "timestamp": 1234567890
  }
}
```

#### Get Delegation Status
```typescript
GET /api/governance/delegations/:address

Response:
{
  "address": "0x...",
  "receivedDelegations": [
    {
      "from": "0x...",
      "votingPower": 100,
      "ballot": "0x...",
      "active": true
    }
  ],
  "givenDelegations": [
    {
      "to": "0x...",
      "votingPower": 100,
      "ballot": "0x...",
      "active": true
    }
  ],
  "totalVotingPower": 500
}
```

### FHE Operations

#### Get Public Key
```typescript
GET /api/fhe/publickey

Response:
{
  "publicKey": "0x...",
  "keyVersion": "1.0.0",
  "algorithm": "TFHE",
  "validUntil": 1234567890
}
```

#### Encrypt Data
```typescript
POST /api/fhe/encrypt
Content-Type: application/json

Request:
{
  "data": 42,
  "dataType": "uint32",
  "publicKey": "0x..."
}

Response:
{
  "encryptedData": "0x...",
  "encryptionProof": "0x...",
  "timestamp": 1234567890
}
```

#### Verify Encryption
```typescript
GET /api/fhe/verify/:encryptionHash

Response:
{
  "valid": true,
  "encryptionHash": "0x...",
  "timestamp": 1234567890,
  "dataType": "uint32"
}
```

## WebSocket Events

### Connection
```typescript
const ws = new WebSocket(WS_URL);

ws.on('connect', () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['votes', 'results', 'proposals']
  }));
});
```

### Event Types

#### New Vote Event
```typescript
{
  "type": "new_vote",
  "data": {
    "ballot": "0x...",
    "voter": "0x...",
    "timestamp": 1234567890,
    "encryptedVoteHash": "0x...",
    "currentTally": "encrypted:0x..."
  }
}
```

#### Proposal Update Event
```typescript
{
  "type": "proposal_update",
  "data": {
    "proposalId": "prop_123",
    "status": "ended",
    "finalTally": "encrypted:0x...",
    "timestamp": 1234567890
  }
}
```

#### Results Revealed Event
```typescript
{
  "type": "results_revealed",
  "data": {
    "ballot": "0x...",
    "results": [120, 80, 50],
    "winner": 0,
    "totalVotes": 250,
    "timestamp": 1234567890
  }
}
```

## Error Responses

### Standard Error Format
```typescript
{
  "error": {
    "code": "INVALID_VOTE",
    "message": "The submitted vote is invalid",
    "details": {
      "reason": "Voting period has ended",
      "ballot": "0x...",
      "endTime": 1234567890
    }
  },
  "timestamp": 1234567890
}
```

### Error Codes
- `INVALID_VOTE`: Vote validation failed
- `BALLOT_NOT_FOUND`: Specified ballot doesn't exist
- `VOTING_ENDED`: Voting period has concluded
- `ALREADY_VOTED`: User has already cast a vote
- `INSUFFICIENT_POWER`: Not enough voting power
- `ENCRYPTION_ERROR`: FHE encryption failed
- `SIGNATURE_INVALID`: Signature verification failed
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

### Limits
- General API: 100 requests per minute
- Vote submission: 10 requests per minute
- FHE operations: 20 requests per minute
- WebSocket messages: 50 per minute

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Authentication

### JWT Token Structure
```typescript
{
  "address": "0x...",
  "nonce": "123456",
  "iat": 1234567890,
  "exp": 1234567900,
  "permissions": ["vote", "propose", "delegate"]
}
```

### Authentication Flow
1. Request nonce: `GET /api/auth/nonce/:address`
2. Sign message with wallet
3. Submit signature: `POST /api/auth/verify`
4. Receive JWT token
5. Include in headers: `Authorization: Bearer <token>`