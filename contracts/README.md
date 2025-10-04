# FHE Voting Platform Smart Contracts

Privacy-preserving voting smart contracts using Fully Homomorphic Encryption (FHE) powered by Zama's fhEVM.

## Overview

This repository contains the smart contract implementation for a comprehensive voting platform that ensures vote privacy through FHE technology. The platform supports multiple voting mechanisms including single-choice, weighted, and quadratic voting.

## Features

- **Privacy-Preserving Voting**: All votes are encrypted and tallied homomorphically
- **Multiple Voting Types**:
  - Single-choice voting
  - Weighted voting (based on token holdings or assigned weight)
  - Quadratic voting (with credit allocation)
- **Access Control**: Whitelist/credential gating for restricted voting
- **Time-based Voting**: Configurable voting periods with automatic enforcement
- **Threshold Decryption**: Results revealed only after voting ends
- **Zero-Knowledge Proofs**: Vote validity verification without revealing choices

## Contract Architecture

```
contracts/src/
├── IFHEVoting.sol           # Interface definitions
├── FHEVotingBase.sol        # Base contract with FHE utilities
├── FHEBallot.sol            # Main voting implementation
└── FHEQuadraticVoting.sol   # Quadratic voting extension
```

### Key Contracts

- **FHEVotingBase**: Abstract base contract providing FHE operations, access control, and security features
- **FHEBallot**: Main voting contract supporting single-choice and weighted voting
- **FHEQuadraticVoting**: Extension for quadratic voting with credit allocation
- **IFHEVoting**: Interface defining standard voting operations

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd fhe-voting/contracts

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

1. Set up your `.env` file with:
   - Private key for deployment
   - RPC URLs for target networks
   - API keys for verification services

2. Configure network settings in `hardhat.config.js`

## Compilation

```bash
# Compile contracts
npm run compile

# Check contract sizes
npm run size
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/FHEVoting.test.js
```

## Deployment

```bash
# Deploy to local network
npm run deploy:local

# Deploy to Zama Devnet
npm run deploy:devnet

# Deploy to specific network
npx hardhat run scripts/deploy.js --network <network-name>
```

## Usage Examples

### Creating a Voting

```javascript
const config = {
  name: "Presidential Election 2024",
  description: "Vote for the next president",
  voteType: 0, // SingleChoice
  startTime: Math.floor(Date.now() / 1000) + 3600,
  endTime: Math.floor(Date.now() / 1000) + 86400 * 7,
  quorum: 100,
  whitelistEnabled: false,
  maxVotersCount: 10000
};

const options = ["Candidate A", "Candidate B", "Candidate C"];
const descriptions = ["Description A", "Description B", "Description C"];

await ballot.createVoting(config, options, descriptions);
```

### Casting a Vote

```javascript
// Encrypt vote client-side
const encryptedVote = await encryptVote(optionIndex);
const proof = await generateProof(encryptedVote);

// Submit to contract
await ballot.castVote(votingId, encryptedVote, proof);
```

### Quadratic Voting

```javascript
// Allocate credits across options
const credits = [25, 16, 9]; // 25 credits = 5 votes, 16 = 4 votes, 9 = 3 votes
const encryptedVotes = await encryptAllocations(credits);

await quadraticVoting.castQuadraticVote(
  votingId,
  encryptedVotes,
  credits,
  proof
);
```

## Security Considerations

1. **Vote Privacy**: All votes remain encrypted throughout the voting process
2. **Double Voting Prevention**: Each address can only vote once per voting
3. **Proof Verification**: Zero-knowledge proofs ensure vote validity
4. **Access Control**: Owner-only functions for critical operations
5. **Emergency Pause**: Circuit breaker for emergency situations
6. **Time Enforcement**: Automatic enforcement of voting periods

## Gas Optimization

- Batch operations for multiple vote processing
- Optimized FHE operation grouping
- Minimal storage updates
- Event-based state tracking

## Network Support

- **Zama Devnet**: Primary deployment target with native FHE support
- **Ethereum L2s**: Compatible with FHE-enabled L2 solutions
- **Test Networks**: Sepolia, Goerli, Mumbai for testing

## Development

### Linting

```bash
npm run lint
npm run prettier
```

### Security Analysis

```bash
npm run slither
```

### Generate Documentation

```bash
npx hardhat docgen
```

## FHE Operations

The contracts use Zama's fhEVM for homomorphic operations:

- **Encryption**: Convert plaintext votes to encrypted values
- **Addition**: Homomorphic vote tallying
- **Comparison**: Determine winners without decryption
- **Reencryption**: Allow voters to verify their encrypted votes
- **Threshold Decryption**: Reveal results after voting ends

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Link to issues]
- Documentation: [Link to docs]
- Discord: [Link to Discord]

## Acknowledgments

Built with:
- [Zama fhEVM](https://github.com/zama-ai/fhevm)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [Hardhat](https://hardhat.org/)

## Audit Status

⚠️ These contracts have not been audited. Use at your own risk in production.