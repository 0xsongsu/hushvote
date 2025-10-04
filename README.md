# HushVote - Privacy-Preserving Voting System

<div align="center">
  <img src="./lockup_monogram_hv.svg" alt="HushVote Logo" width="300"/>
  <h3>A decentralized voting platform leveraging Fully Homomorphic Encryption (FHE) for complete voter privacy</h3>
</div>

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Smart Contract Addresses](#smart-contract-addresses)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Security](#security)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

HushVote is a revolutionary decentralized voting system that ensures complete voter privacy while maintaining transparency and verifiability. Built on Zama's Fully Homomorphic Encryption (FHE) technology, HushVote allows votes to be counted without ever decrypting individual ballots, providing unprecedented privacy in blockchain-based voting.

### Key Innovation

Unlike traditional blockchain voting systems where votes are publicly visible, HushVote:
- **Encrypts votes end-to-end**: Votes remain encrypted from submission through tallying
- **Performs homomorphic computation**: Vote counting happens on encrypted data
- **Ensures verifiability**: Results can be verified without revealing individual votes
- **Prevents vote buying**: No one can prove how they voted, even to themselves

## Features

### Core Voting Features
- **Private Ballot Voting**: Standard encrypted voting with multiple choice options
- **Weighted Voting**: Support for votes with different weights based on stakeholder power
- **Quadratic Voting**: Implementation of quadratic voting for more nuanced preference expression
- **Time-Bounded Voting**: Automatic start and end times with on-chain enforcement
- **Quorum Requirements**: Configurable minimum participation thresholds
- **Whitelist Support**: Optional voter eligibility restrictions

### Privacy & Security Features
- **FHE-based Encryption**: Utilizing Zama's fhEVM for homomorphic operations
- **Zero-Knowledge Proofs**: Vote validity verification without revealing content
- **Encrypted Tallying**: Vote counting performed on encrypted data
- **Secure Key Management**: Integration with Zama's KMS for decryption control
- **Tamper-Proof Results**: Immutable on-chain storage of voting outcomes

### User Experience Features
- **Web3 Wallet Integration**: Seamless connection via Privy SDK
- **Real-Time Updates**: Live voting statistics and participation metrics
- **Mobile Responsive**: Full functionality across all devices
- **Intuitive Dashboard**: Clean, modern interface following Linear design principles
- **Multi-Language Support**: (Planned) Internationalization for global accessibility

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Voting UI  │  │  Dashboard   │  │    Admin     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └──────────────────┴──────────────────┘             │
│                            │                                 │
│                     ┌──────▼───────┐                        │
│                     │   Services   │                        │
│                     │  (FHE Utils) │                        │
│                     └──────┬───────┘                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │    Smart Contracts │
                    │     (Solidity)      │
                    ├────────────────────┤
                    │    FHEBallot.sol   │
                    │ FHEQuadraticVoting │
                    │  FHEVotingBase.sol │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Zama fhEVM Layer  │
                    │  ┌──────────────┐  │
                    │  │ Coprocessor  │  │
                    │  ├──────────────┤  │
                    │  │     KMS      │  │
                    │  ├──────────────┤  │
                    │  │   Oracle     │  │
                    │  └──────────────┘  │
                    └────────────────────┘
```

### Contract Architecture

The smart contract system follows a modular design:

1. **FHEVotingBase.sol**: Base contract with common functionality
   - Access control and pausability
   - Public key management
   - Proof verification framework

2. **IFHEVoting.sol**: Interface definitions
   - Standard voting methods
   - Event definitions
   - Type declarations

3. **FHEBallot.sol**: Main voting implementation
   - Standard and weighted voting logic
   - Encrypted vote tallying
   - Result decryption management

4. **FHEQuadraticVoting.sol**: Quadratic voting extension
   - Credit-based voting system
   - Quadratic cost calculation
   - Multi-option vote distribution

## Technology Stack

### Blockchain & Cryptography
- **Zama fhEVM**: Fully Homomorphic Encryption virtual machine
- **Ethereum Sepolia**: Test network deployment
- **Solidity ^0.8.19**: Smart contract language
- **@fhevm/solidity**: v0.8.0 - FHE operations library
- **Hardhat**: Development environment and testing framework

### Frontend
- **React 18.2**: UI framework
- **TypeScript 5.2**: Type-safe JavaScript
- **Vite 5.2**: Build tool and dev server
- **Ant Design 5.15**: UI component library
- **TanStack Query 5.28**: Data fetching and caching
- **React Router 6.22**: Client-side routing

### Web3 Integration
- **Ethers.js 6.11**: Ethereum interaction library
- **Privy SDK 2.24**: Web3 authentication and wallet management
- **fhevmjs 0.8.0**: Client-side FHE operations

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Vercel**: Deployment platform

## Project Structure

```
hushvote/
├── contracts/                # Smart contracts
│   ├── src/                 # Contract source files
│   │   ├── FHEBallot.sol   # Main voting contract
│   │   ├── FHEQuadraticVoting.sol
│   │   ├── FHEVotingBase.sol
│   │   └── IFHEVoting.sol  # Interface definitions
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── hardhat.config.js    # Hardhat configuration
│
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── VotePage.tsx
│   │   │   ├── CreateVoting.tsx
│   │   │   └── Results.tsx
│   │   ├── services/       # API and contract services
│   │   ├── utils/          # Utility functions
│   │   │   └── fhe.ts      # FHE encryption utilities
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.tsx         # Main application
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── backend/                 # Backend API (optional)
│   ├── src/                # Source files
│   └── package.json        # Backend dependencies
│
└── README.md               # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn v1.22.0+)
- **Git**: Latest version
- **MetaMask**: Or any Web3-compatible wallet

### Required Accounts
- **Ethereum Wallet**: With Sepolia testnet ETH
- **Infura/Alchemy**: RPC provider account (optional for local development)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/hushvote.git
cd hushvote
```

### 2. Install Contract Dependencies

```bash
cd contracts
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Install Backend Dependencies (Optional)

```bash
cd ../backend
npm install
```

## Configuration

### 1. Smart Contract Configuration

Create a `.env` file in the `contracts` directory:

```env
# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Private Keys (NEVER commit these!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Etherscan API (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Zama FHE Configuration (Sepolia)
FHE_COPROCESSOR_ADDRESS=0x848B0066793BcC60346Da1F49049357399B8D595
FHE_ACL_ADDRESS=0x687820221192C5B662b25367F70076A37bc79b6c
FHE_KMS_VERIFIER_ADDRESS=0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
FHE_ORACLE_ADDRESS=0x45e8C85e036b14De38893E1b002E616d64224018
```

### 2. Frontend Configuration

Create a `.env` file in the `frontend` directory:

```env
# Vite environment variables
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_CONTRACT_ADDRESS=deployed_contract_address
VITE_NETWORK_NAME=sepolia
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Optional: Analytics
VITE_GA_TRACKING_ID=your_google_analytics_id
```

### 3. Privy Configuration

1. Create an account at [Privy.io](https://www.privy.io/)
2. Create a new application
3. Configure allowed domains:
   - Development: `http://localhost:5173`
   - Production: Your production domain
4. Copy the App ID to your `.env` file

## Deployment

### Smart Contract Deployment

#### 1. Compile Contracts

```bash
cd contracts
npx hardhat compile
```

#### 2. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Save the deployed contract addresses for frontend configuration.

#### 3. Verify Contracts

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "constructor_arg1" "constructor_arg2"
```

### Frontend Deployment

#### Option 1: Vercel Deployment (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd frontend
vercel
```

3. Follow the prompts to configure your deployment

#### Option 2: Manual Build and Deploy

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. The `dist` folder contains the static files ready for deployment

3. Deploy to your preferred hosting service (Netlify, AWS S3, etc.)

#### Option 3: Docker Deployment

1. Build Docker image:
```bash
docker build -t hushvote-frontend ./frontend
```

2. Run container:
```bash
docker run -p 80:80 -e VITE_CONTRACT_ADDRESS=0x... hushvote-frontend
```

## Smart Contract Addresses

### Sepolia Testnet (Current Deployment)

| Contract | Address | Block |
|----------|---------|-------|
| FHEBallot | `0x...` | TBD |
| FHEQuadraticVoting | `0x...` | TBD |

### Mainnet (Future Deployment)

| Contract | Address | Block |
|----------|---------|-------|
| FHEBallot | TBD | TBD |
| FHEQuadraticVoting | TBD | TBD |

## Usage

### Creating a Voting Session

1. **Connect Wallet**: Click "Connect Wallet" and authorize with Privy
2. **Navigate to Create**: Go to the "Create Voting" page
3. **Configure Voting**:
   - Set voting name and description
   - Choose voting type (Standard/Weighted/Quadratic)
   - Add voting options (minimum 2)
   - Set start and end times
   - Configure quorum (optional)
   - Enable whitelist (optional)
4. **Deploy**: Submit transaction to create voting on-chain

### Casting a Vote

1. **Browse Votings**: View active votings on the dashboard
2. **Select Voting**: Click on a voting to view details
3. **Cast Vote**:
   - Select your preferred option(s)
   - For quadratic voting, allocate credits
   - Confirm your encrypted vote
4. **Submit**: Sign and submit the transaction

### Viewing Results

1. **Wait for End**: Results are available after voting ends
2. **Request Decryption**: Voting creator can request result decryption
3. **View Results**: Once decrypted, results show:
   - Total votes per option
   - Winner determination
   - Participation statistics

## API Reference

### Smart Contract Functions

#### Create Voting
```solidity
function createVoting(
    VotingConfig calldata config,
    string[] calldata optionNames,
    string[] calldata optionDescriptions
) external returns (uint256 votingId)
```

#### Cast Vote
```solidity
function castVote(
    uint256 votingId,
    bytes calldata encryptedVote,
    bytes calldata proof
) external
```

#### Request Decryption
```solidity
function requestDecryption(uint256 votingId) external
```

### Frontend Services

#### FHE Service
```typescript
// Initialize FHE
await initializeFHE()

// Encrypt vote
const encrypted = await encryptVote(optionIndex)

// Generate proof
const proof = generateProof(encrypted, voterAddress)
```

#### Contract Service
```typescript
// Create voting
await contractService.createVoting(config, options)

// Cast vote
await contractService.castVote(votingId, encryptedVote, proof)

// Get results
const results = await contractService.getDecryptedResults(votingId)
```

## Security

### Security Features

1. **End-to-End Encryption**: Votes are encrypted client-side before submission
2. **Homomorphic Operations**: All computations on votes happen in encrypted space
3. **Access Control**: Role-based permissions for administrative functions
4. **Reentrancy Protection**: Guards against reentrancy attacks
5. **Pausability**: Emergency pause mechanism for critical issues
6. **Time Locks**: Voting periods enforced on-chain
7. **Proof Verification**: Zero-knowledge proofs validate vote integrity

### Security Audits

- **Smart Contract Audit**: (Planned)
- **Frontend Security Review**: (Planned)
- **FHE Implementation Review**: (Planned)

### Best Practices

1. **Never share private keys**
2. **Verify contract addresses before interaction**
3. **Use hardware wallets for high-value operations**
4. **Check voting parameters before casting votes**
5. **Verify SSL certificates when accessing the web app**

## Testing

### Smart Contract Tests

```bash
cd contracts

# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/FHEBallot.test.js

# Run with coverage
npx hardhat coverage

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

### Integration Tests

```bash
# Start local blockchain
cd contracts
npx hardhat node

# Deploy contracts locally
npx hardhat run scripts/deploy.js --network localhost

# Run integration tests
npm run test:integration
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Solidity: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- TypeScript/React: ESLint and Prettier configurations are provided
- Commits: Follow [Conventional Commits](https://www.conventionalcommits.org/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Zama**: For pioneering FHE technology and the fhEVM
- **Ethereum Foundation**: For the robust blockchain platform
- **OpenZeppelin**: For secure smart contract libraries
- **Community Contributors**: For feedback and improvements

## Contact

- **Website**: [hushvote.io](https://hushvote.io) (Coming Soon)
- **Email**: contact@hushvote.io
- **Twitter**: [@HushVote](https://twitter.com/hushvote)
- **Discord**: [Join our community](https://discord.gg/hushvote)

---

<div align="center">
  <p>Built with ❤️ for privacy and democracy</p>
  <p>Powered by Zama's Fully Homomorphic Encryption</p>
</div>