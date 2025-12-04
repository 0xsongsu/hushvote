# HushVote - Privacy-Preserving Voting Platform

<div align="center">
  <img src="./lockup_monogram_hv.svg" alt="HushVote Logo" width="300"/>

  <h3>Decentralized Voting with Fully Homomorphic Encryption (FHE)</h3>
  <p><em>Vote in complete privacy. Verify with absolute certainty.</em></p>

  <p>
    <a href="https://hushvote.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/Live_Demo-hushvote.vercel.app-6366f1?style=for-the-badge&logo=vercel" alt="Live Demo"/>
    </a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity" alt="Solidity"/>
    <img src="https://img.shields.io/badge/fhEVM-0.9.1-00D4AA?style=flat-square" alt="fhEVM"/>
    <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react" alt="React"/>
    <img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Network-Sepolia-orange?style=flat-square&logo=ethereum" alt="Network"/>
  </p>
</div>

---

## Table of Contents

- [Introduction](#introduction)
- [Why FHE for Voting?](#why-fhe-for-voting)
- [Technical Architecture](#technical-architecture)
- [Smart Contract Design](#smart-contract-design)
- [FHE Implementation Details](#fhe-implementation-details)
- [Frontend Architecture](#frontend-architecture)
- [Deployed Contracts](#deployed-contracts)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment Guide](#deployment-guide)
- [Security Considerations](#security-considerations)
- [API Reference](#api-reference)
- [License](#license)

---

## Introduction

HushVote is a next-generation decentralized voting platform that leverages **Fully Homomorphic Encryption (FHE)** to achieve true ballot privacy on the blockchain. Unlike traditional blockchain voting systems where votes are publicly visible, HushVote ensures that individual votes remain encrypted throughout the entire lifecycle - from submission through tallying to result verification.

### The Privacy Problem in Blockchain Voting

Traditional blockchain voting faces a fundamental paradox:
- **Transparency** is blockchain's core value proposition
- **Privacy** is essential for free and fair voting

Most blockchain voting solutions compromise by either:
1. Making votes fully transparent (destroying ballot secrecy)
2. Using centralized mixers or trusted third parties (introducing trust assumptions)
3. Relying on complex ZK circuits that don't support aggregation (limiting functionality)

### HushVote's Solution

HushVote resolves this paradox using **Fully Homomorphic Encryption**:

```
Traditional Voting:     vote → encrypt → decrypt → tally
HushVote:              vote → encrypt → tally(encrypted) → decrypt(result only)
```

With FHE, mathematical operations can be performed directly on encrypted data. This means:
- Individual votes **never need to be decrypted** for counting
- Only the **final aggregate result** is decrypted
- **Complete ballot secrecy** is maintained while achieving **full verifiability**

---

## Why FHE for Voting?

### Comparison with Other Privacy Solutions

| Feature | Transparent Voting | Commit-Reveal | ZK-SNARKs | MPC | **FHE (HushVote)** |
|---------|-------------------|---------------|-----------|-----|-------------------|
| Ballot Privacy | None | Temporal | Full | Full | **Full** |
| On-chain Verification | Full | Full | Full | Partial | **Full** |
| Aggregation Support | N/A | Manual | Limited | Complex | **Native** |
| Trusted Setup | No | No | Yes* | No | **No** |
| Computational Cost | Low | Low | High | Very High | **Medium** |
| Implementation Complexity | Low | Medium | Very High | Very High | **Medium** |

*Some ZK systems like STARKs don't require trusted setup but have other tradeoffs.

### Key Advantages of FHE

1. **Native Aggregation**: FHE naturally supports addition and multiplication on encrypted values, perfect for vote tallying
2. **No Trusted Setup**: Unlike ZK-SNARKs with ceremony requirements, fhEVM is ready to use
3. **Composability**: Encrypted values can be passed between contracts and combined
4. **Verifiability**: All operations are performed on-chain and can be audited

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     React Frontend (Vite)                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  Dashboard   │  │  VotePage    │  │  CreateVoting        │  │   │
│  │  │  - All votes │  │  - Cast vote │  │  - Configure voting  │  │   │
│  │  │  - Stats     │  │  - View opts │  │  - Deploy on-chain   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  │                            │                                     │   │
│  │  ┌─────────────────────────▼─────────────────────────────────┐  │   │
│  │  │                    VotingContext                           │  │   │
│  │  │  - Global state management                                 │  │   │
│  │  │  - Batch RPC optimization (N*3 → 4 calls)                 │  │   │
│  │  │  - React Query caching                                     │  │   │
│  │  └─────────────────────────┬─────────────────────────────────┘  │   │
│  │                            │                                     │   │
│  │  ┌─────────────────────────▼─────────────────────────────────┐  │   │
│  │  │                 Web3 Integration Layer                     │  │   │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │  │   │
│  │  │  │ Privy SDK     │  │ Ethers.js 6   │  │ FHE Utils     │  │  │   │
│  │  │  │ - Auth        │  │ - Contracts   │  │ - Encryption  │  │  │   │
│  │  │  │ - Wallets     │  │ - Signing     │  │ - Proofs      │  │  │   │
│  │  │  └───────────────┘  └───────────────┘  └───────────────┘  │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ JSON-RPC
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BLOCKCHAIN LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Smart Contracts (Solidity 0.8.24)             │   │
│  │                                                                   │   │
│  │   ┌─────────────────────────────────────────────────────────┐   │   │
│  │   │                    IFHEVoting.sol                        │   │   │
│  │   │   Interface defining voting standards & types            │   │   │
│  │   │   - VotingConfig, VoteOption, VoterInfo structs         │   │   │
│  │   │   - externalEuint32 for encrypted inputs (0.9.1)        │   │   │
│  │   └─────────────────────────────────────────────────────────┘   │   │
│  │                              ▲                                   │   │
│  │                              │ implements                        │   │
│  │   ┌─────────────────────────┴─────────────────────────────┐     │   │
│  │   │                  FHEVotingBase.sol                      │     │   │
│  │   │   - Ownable, Pausable, ReentrancyGuard                 │     │   │
│  │   │   - Common FHE utilities and encryption helpers         │     │   │
│  │   │   - Access control and configuration management         │     │   │
│  │   └─────────────────────────┬─────────────────────────────┘     │   │
│  │                              │ extends                           │   │
│  │          ┌───────────────────┴───────────────────┐               │   │
│  │          ▼                                       ▼               │   │
│  │   ┌─────────────────┐                   ┌─────────────────┐     │   │
│  │   │  FHEBallot.sol  │                   │FHEQuadraticVoting│     │   │
│  │   │                 │                   │                  │     │   │
│  │   │ - SingleChoice  │                   │ - Credit system  │     │   │
│  │   │ - MultiChoice   │                   │ - Quadratic cost │     │   │
│  │   │ - Weighted      │                   │ - Multi-option   │     │   │
│  │   │ - Batch reads   │                   │   allocation     │     │   │
│  │   └─────────────────┘                   └─────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    │ FHE Operations                     │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Zama fhEVM Infrastructure                     │   │
│  │                                                                   │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │   │ Coprocessor │  │    KMS      │  │   Gateway/Oracle        │ │   │
│  │   │             │  │             │  │                         │ │   │
│  │   │ FHE compute │  │ Key mgmt   │  │ Decryption requests     │ │   │
│  │   │ on euint32  │  │ & access   │  │ & callbacks             │ │   │
│  │   └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Casting a Vote

```
1. User selects option     2. Client encrypts      3. Transaction sent
   in frontend                using FHE                with proof
        │                         │                        │
        ▼                         ▼                        ▼
   ┌─────────┐              ┌──────────┐            ┌──────────────┐
   │ Option: │  ────────►   │ euint32  │  ───────►  │ castVote()   │
   │   "A"   │              │ encrypted│            │ on FHEBallot │
   └─────────┘              └──────────┘            └──────────────┘
                                                           │
                                                           ▼
4. Contract validates    5. Homomorphic add       6. Vote recorded
   and processes            to option total          (encrypted)
        │                         │                        │
        ▼                         ▼                        ▼
   ┌───────────┐           ┌────────────────┐      ┌────────────────┐
   │ Verify:   │           │ option.votes = │      │ hasVoted[user] │
   │ - Active  │           │   FHE.add(     │      │     = true     │
   │ - !voted  │           │     votes,     │      │                │
   │ - proof   │           │     encrypted  │      │ totalVoters++  │
   └───────────┘           │   )            │      └────────────────┘
                           └────────────────┘
```

---

## Smart Contract Design

### Contract Hierarchy

```solidity
// IFHEVoting.sol - Interface Layer
interface IFHEVoting {
    enum VotingStatus { NotStarted, Active, Ended, Tallied }
    enum VoteType { SingleChoice, MultiChoice, Weighted, Quadratic }

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

    // fhEVM 0.9.1: externalEuint32 for external encrypted inputs
    function castVote(
        uint256 votingId,
        externalEuint32 encryptedVote,
        bytes calldata proof
    ) external;
}

// FHEVotingBase.sol - Base Implementation
abstract contract FHEVotingBase is
    IFHEVoting,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    // Common state and FHE utilities
    mapping(uint256 => Voting) internal votings;
    uint256 public votingCounter;

    // Batch read optimization
    function getAllVotingSummaries() external view returns (VotingSummary[] memory);
    function batchHasVoted(uint256 votingId, address[] calldata voters) external view;
}

// FHEBallot.sol - Standard Voting Implementation
contract FHEBallot is FHEVotingBase {
    // SingleChoice, MultiChoice, Weighted voting
    function castVote(...) external override {
        // Validate voting state
        require(getVotingStatus(votingId) == VotingStatus.Active, "Not active");
        require(!hasVoted[votingId][msg.sender], "Already voted");

        // Process encrypted vote using FHE operations
        euint32 vote = FHE.fromExternal(encryptedVote);
        options[selectedOption].votes = FHE.add(
            options[selectedOption].votes,
            vote
        );

        // Record participation
        hasVoted[votingId][msg.sender] = true;
        totalVoters[votingId]++;
    }
}

// FHEQuadraticVoting.sol - Quadratic Voting Implementation
contract FHEQuadraticVoting is FHEVotingBase {
    mapping(uint256 => mapping(address => uint256)) public voterCredits;
    mapping(uint256 => uint256) public defaultCredits;

    function castQuadraticVote(
        uint256 votingId,
        externalEuint32[] calldata encryptedVotes,
        uint256[] calldata creditsPerOption,
        bytes calldata proof
    ) external {
        // Validate credits don't exceed allocation
        uint256 totalCredits;
        for (uint i = 0; i < creditsPerOption.length; i++) {
            // Quadratic cost: votes^2 = credits
            totalCredits += creditsPerOption[i];
        }
        require(totalCredits <= voterCredits[votingId][msg.sender], "Insufficient credits");

        // Process each option's encrypted votes
        for (uint i = 0; i < encryptedVotes.length; i++) {
            euint32 votes = FHE.fromExternal(encryptedVotes[i]);
            options[i].votes = FHE.add(options[i].votes, votes);
        }
    }

    // Quadratic cost calculation: cost = votes^2
    function calculateQuadraticCost(uint256 votes) public pure returns (uint256) {
        return votes * votes;
    }
}
```

### FHE Type System (fhEVM 0.9.1)

```solidity
// fhEVM 0.9.1 introduces explicit type separation:

// Internal encrypted types (used within contracts)
euint8, euint16, euint32, euint64, euint128, euint256
ebool, eaddress

// External encrypted types (for function parameters)
externalEuint8, externalEuint16, externalEuint32, ...
externalEbool, externalEaddress

// Conversion between types
euint32 internal = FHE.fromExternal(externalEuint32 external);
externalEuint32 external = FHE.toExternal(euint32 internal);

// FHE Operations available:
FHE.add(euint32 a, euint32 b)      // Homomorphic addition
FHE.sub(euint32 a, euint32 b)      // Homomorphic subtraction
FHE.mul(euint32 a, euint32 b)      // Homomorphic multiplication
FHE.eq(euint32 a, euint32 b)       // Encrypted equality check
FHE.lt(euint32 a, euint32 b)       // Encrypted less-than
FHE.select(ebool cond, euint32 a, euint32 b)  // Encrypted conditional
```

### Batch Reading Optimization

One of HushVote's key optimizations is batch reading to minimize RPC calls:

```solidity
// Before: N votings × 3 calls = 3N RPC calls
for (uint i = 0; i < N; i++) {
    getVotingConfig(i);      // Call 1
    getOptions(i);           // Call 2
    getVoterInfo(i, user);   // Call 3
}

// After: 4 constant calls regardless of N
function getAllVotingSummaries() external view returns (VotingSummary[] memory) {
    VotingSummary[] memory summaries = new VotingSummary[](votingCounter);
    for (uint i = 0; i < votingCounter; i++) {
        summaries[i] = VotingSummary({
            id: i,
            name: votings[i].config.name,
            status: getVotingStatus(i),
            totalVoters: totalVoters[i],
            optionCount: votings[i].options.length,
            // ... other fields
        });
    }
    return summaries;
}

function batchHasVoted(uint256 votingId, address[] calldata voters)
    external view returns (bool[] memory)
{
    bool[] memory results = new bool[](voters.length);
    for (uint i = 0; i < voters.length; i++) {
        results[i] = hasVoted[votingId][voters[i]];
    }
    return results;
}
```

---

## FHE Implementation Details

### Vote Encryption Flow

```typescript
// Frontend encryption (simplified)
async function encryptVote(optionIndex: number): Promise<{
  encrypted: Uint8Array;
  proof: Uint8Array;
}> {
  // 1. Create plaintext vote (e.g., 1 for selected, 0 for others)
  const vote = optionIndex === selectedOption ? 1 : 0;

  // 2. Encrypt using contract's public key
  const publicKey = await contract.getPublicKey();
  const encrypted = fhevm.encrypt32(vote, publicKey);

  // 3. Generate ZK proof of valid encryption
  const proof = fhevm.generateProof(encrypted, voterAddress);

  return { encrypted, proof };
}
```

### Decryption Process (Post-Voting)

```solidity
// Only after voting ends, owner can request decryption
function requestDecryption(uint256 votingId) external onlyOwner {
    require(getVotingStatus(votingId) == VotingStatus.Ended, "Not ended");

    // Request decryption through Zama's Gateway
    for (uint i = 0; i < votings[votingId].options.length; i++) {
        Gateway.requestDecryption(
            abi.encode(votingId, i),
            this.decryptionCallback.selector,
            votings[votingId].options[i].encryptedVotes
        );
    }
}

// Callback receives decrypted results
function decryptionCallback(
    uint256 requestId,
    uint256 decryptedValue
) external onlyGateway {
    (uint256 votingId, uint256 optionIndex) = abi.decode(
        requestId,
        (uint256, uint256)
    );

    votings[votingId].decryptedResults[optionIndex] = decryptedValue;

    // Check if all options decrypted
    if (allOptionsDecrypted(votingId)) {
        votings[votingId].status = VotingStatus.Tallied;
        emit ResultsDecrypted(votingId, getDecryptedResults(votingId));
    }
}
```

---

## Frontend Architecture

### State Management with VotingContext

```typescript
// VotingContext provides global state with optimized data fetching
interface VotingContextType {
  votings: VotingSummary[];
  userVotedMap: Record<number, boolean>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// React Query integration for caching and background updates
const VotingProvider: React.FC = ({ children }) => {
  const { data: summaries } = useQuery({
    queryKey: ['votings', 'all'],
    queryFn: () => contract.getAllVotingSummaries(),
    staleTime: 30_000,  // 30s cache
    refetchInterval: 60_000,  // Background refresh every 60s
  });

  const { data: hasVotedResults } = useQuery({
    queryKey: ['votings', 'hasVoted', address],
    queryFn: async () => {
      const results: Record<number, boolean> = {};
      // Batch check all votings in single call
      for (const voting of summaries) {
        results[voting.id] = await contract.hasVoted(voting.id, address);
      }
      return results;
    },
    enabled: !!address && !!summaries,
  });

  return (
    <VotingContext.Provider value={{ votings: summaries, userVotedMap: hasVotedResults }}>
      {children}
    </VotingContext.Provider>
  );
};
```

### Component Architecture

```
src/
├── components/
│   ├── common/
│   │   ├── PageLoading.tsx      # Consistent loading states
│   │   ├── EmptyState.tsx       # Empty data placeholders
│   │   └── StatusBadge.tsx      # Voting status indicators
│   ├── voting/
│   │   ├── VotingCard.tsx       # Dashboard voting card
│   │   ├── VoteOptions.tsx      # Option selection UI
│   │   ├── QuadraticSlider.tsx  # Credit allocation for QV
│   │   └── ResultsChart.tsx     # Results visualization
│   └── layout/
│       ├── Header.tsx           # Navigation & wallet
│       └── Sidebar.tsx          # Main navigation
│
├── pages/
│   ├── Dashboard.tsx            # Voting list with filters
│   ├── VotePage.tsx             # Individual voting view
│   ├── CreateVoting.tsx         # Voting creation form
│   └── Results.tsx              # Results display
│
├── context/
│   └── VotingContext.tsx        # Global voting state
│
├── hooks/
│   ├── useVoting.ts             # Voting operations hook
│   ├── useWallet.ts             # Wallet connection
│   └── useFHE.ts                # FHE encryption utilities
│
├── services/
│   ├── contract.ts              # Contract interactions
│   └── fhe.ts                   # FHE client-side ops
│
└── config/
    ├── contracts.ts             # Contract addresses
    └── chains.ts                # Network configuration
```

---

## Deployed Contracts

### Sepolia Testnet (Production)

| Contract | Address | Verified |
|----------|---------|----------|
| **FHEBallot** | `0x14F44201Cb91929e4dddB5455DE26B720A81d327` | Yes |
| **FHEQuadraticVoting** | `0x9a075d9a70Cb72884Abf2c42bd48497b1125510e` | Yes |

### Active Votings

The following votings are currently live on Sepolia:

**FHEBallot Contract:**
| ID | Name | Type | Duration |
|----|------|------|----------|
| 0 | Quick Team Lunch Poll | SingleChoice | 2 hours |
| 1 | Product Feature Priority | SingleChoice | 1 day |
| 2 | Community Meetup Location | SingleChoice | 3 days |
| 3 | Protocol Upgrade v2.0 | SingleChoice | 1 week |
| 4 | Q1 Treasury Allocation | Weighted | 5 days |
| 5 | Hackathon Track Selection | MultiChoice | 2 days |

**FHEQuadraticVoting Contract:**
| ID | Name | Credits | Duration |
|----|------|---------|----------|
| 0 | Research Grant Allocation | 100 | 4 days |
| 1 | Ecosystem Fund Distribution | 150 | 10 days |

---

## Technology Stack

### Smart Contracts

| Package | Version | Purpose |
|---------|---------|---------|
| `@fhevm/solidity` | ^0.9.1 | FHE operations library |
| `@openzeppelin/contracts` | ^5.0.0 | Security base contracts |
| `@openzeppelin/contracts-upgradeable` | ^5.0.0 | Upgradeable patterns |
| `@zama-fhe/relayer-sdk` | 0.3.0-5 | Relayer integration |
| `hardhat` | ^2.26.3 | Development environment |
| `ethers` | ^6.13.4 | Ethereum interactions |
| `@fhevm/hardhat-plugin` | 0.3.0-1 | FHE Hardhat integration |

**Compiler Settings:**
```javascript
{
  version: "0.8.24",
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    evmVersion: "cancun"
  }
}
```

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI framework |
| `typescript` | ^5.2.2 | Type safety |
| `vite` | ^5.2.0 | Build tool |
| `antd` | ^5.15.0 | UI components |
| `@tanstack/react-query` | ^5.28.0 | Data fetching & caching |
| `ethers` | ^6.15.0 | Web3 interactions |
| `@privy-io/react-auth` | ^2.24.0 | Wallet authentication |
| `react-router-dom` | ^6.22.0 | Client routing |
| `recharts` | ^2.12.0 | Data visualization |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting & CDN |
| **Sepolia** | Ethereum testnet |
| **Zama fhEVM** | FHE coprocessor infrastructure |
| **Infura** | RPC provider |

---

## Project Structure

```
hushvote/
├── contracts/                      # Solidity smart contracts
│   ├── src/                        # Contract source files
│   │   ├── FHEBallot.sol          # Standard/weighted/multi voting
│   │   ├── FHEQuadraticVoting.sol # Quadratic voting with credits
│   │   ├── FHEVotingBase.sol      # Base contract with shared logic
│   │   └── IFHEVoting.sol         # Interface definitions
│   ├── scripts/                    # Deployment & utility scripts
│   │   ├── deploy.js              # Main deployment script
│   │   └── create-votings.js      # Create sample votings
│   ├── test/                       # Contract tests
│   ├── deployments/                # Deployment artifacts
│   ├── hardhat.config.ts          # Hardhat configuration
│   └── package.json               # Contract dependencies
│
├── frontend/                       # React application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Route pages
│   │   ├── context/               # React context providers
│   │   ├── hooks/                 # Custom hooks
│   │   ├── services/              # API & contract services
│   │   ├── config/                # Configuration files
│   │   ├── utils/                 # Utility functions
│   │   └── App.tsx                # Root component
│   ├── public/                     # Static assets
│   ├── vite.config.ts             # Vite configuration
│   └── package.json               # Frontend dependencies
│
├── lockup_monogram_hv.svg         # Logo
├── vercel.json                    # Vercel configuration
└── README.md                      # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH** for gas (get from [Sepolia Faucet](https://sepoliafaucet.com/))

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/hushvote.git
cd hushvote

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` and connect your wallet to start voting!

---

## Configuration

### Contract Environment (.env)

```env
# contracts/.env

# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Deployment Account
DEPLOYER_PRIVATE_KEY=0x...

# Etherscan (for verification)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY

# Optional: Custom network parameters
ENCRYPTION_THRESHOLD=3
```

### Frontend Environment (.env)

```env
# frontend/.env

# Privy Authentication
VITE_PRIVY_APP_ID=your_privy_app_id

# Network Configuration
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Contract Addresses (updated after deployment)
VITE_BALLOT_ADDRESS=0x14F44201Cb91929e4dddB5455DE26B720A81d327
VITE_QUADRATIC_ADDRESS=0x9a075d9a70Cb72884Abf2c42bd48497b1125510e
```

---

## Deployment Guide

### Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### Deploy to Sepolia

```bash
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/deploy.js --network sepolia
```

### Create Sample Votings

```bash
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/create-votings.js --network sepolia
```

### Deploy Frontend

```bash
cd frontend
npm run build

# Deploy to Vercel
vercel --prod
```

---

## Security Considerations

### On-Chain Security

1. **Access Control**: `Ownable` pattern for admin functions
2. **Reentrancy Protection**: `ReentrancyGuard` on all state-changing functions
3. **Pausability**: Emergency pause mechanism
4. **Time Enforcement**: On-chain start/end time validation
5. **Double-Vote Prevention**: `hasVoted` mapping enforcement

### FHE Security Properties

1. **Semantic Security**: Individual votes are computationally indistinguishable
2. **Verifiability**: All FHE operations are performed on-chain
3. **Threshold Decryption**: Results require authorized decryption request
4. **No Trusted Setup**: fhEVM doesn't require ceremony

### Frontend Security

1. **Wallet Validation**: Privy SDK handles secure wallet connections
2. **Transaction Signing**: All transactions require explicit user approval
3. **No Private Key Storage**: Keys never leave the wallet

---

## API Reference

### FHEBallot Contract

```solidity
// Create a new voting
function createVoting(
    VotingConfig calldata config,
    string[] calldata optionNames,
    string[] calldata optionDescriptions
) external returns (uint256 votingId);

// Cast an encrypted vote
function castVote(
    uint256 votingId,
    externalEuint32 encryptedVote,
    bytes calldata proof
) external;

// Batch read all voting summaries
function getAllVotingSummaries() external view returns (VotingSummary[] memory);

// Check if addresses have voted
function batchHasVoted(uint256 votingId, address[] calldata voters)
    external view returns (bool[] memory);

// Request result decryption (owner only)
function requestDecryption(uint256 votingId) external;

// Get decrypted results
function getDecryptedResults(uint256 votingId)
    external view returns (uint256[] memory);
```

### FHEQuadraticVoting Contract

```solidity
// Set default credits for new voters
function setDefaultCredits(uint256 votingId, uint256 credits) external;

// Allocate credits to specific voter
function allocateCredits(uint256 votingId, address voter, uint256 credits) external;

// Cast quadratic vote with credit allocation
function castQuadraticVote(
    uint256 votingId,
    externalEuint32[] calldata encryptedVotes,
    uint256[] calldata creditsPerOption,
    bytes calldata proof
) external;

// Get voter's remaining credits
function getVoterCredits(uint256 votingId, address voter)
    external view returns (uint256);

// Calculate quadratic cost
function calculateQuadraticCost(uint256 votes)
    external pure returns (uint256);
```

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **[Zama](https://www.zama.ai/)** - Pioneering FHE technology and the fhEVM
- **[OpenZeppelin](https://openzeppelin.com/)** - Secure smart contract libraries
- **[Privy](https://www.privy.io/)** - Seamless Web3 authentication
- **[Ant Design](https://ant.design/)** - Beautiful UI components

---

<div align="center">
  <br/>
  <p><strong>HushVote</strong> - Where privacy meets democracy</p>
  <p>Powered by Zama Fully Homomorphic Encryption</p>
  <br/>
  <p>
    <a href="https://hushvote.vercel.app">Live Demo</a> |
    <a href="https://docs.zama.ai/fhevm">fhEVM Docs</a> |
    <a href="https://sepolia.etherscan.io/address/0x14F44201Cb91929e4dddB5455DE26B720A81d327">View Contract</a>
  </p>
</div>
