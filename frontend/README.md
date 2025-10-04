# FHE Voting Platform - Frontend

A modern, privacy-preserving voting platform built with React, TypeScript, and Ant Design 5.0, featuring Fully Homomorphic Encryption (FHE) for complete vote privacy.

## Features

- **End-to-End Encryption**: Votes are encrypted on the client-side using FHE before transmission
- **Privacy-Preserving**: Individual votes remain encrypted throughout the entire voting process
- **Multiple Voting Types**: Single choice, multiple choice, weighted, and quadratic voting
- **Vote Verification**: Reencryption support for vote verification without revealing choices
- **Modern UI**: Linear-style design with Ant Design 5.0 components
- **Dark Mode**: Full dark mode support with smooth transitions
- **Responsive**: Mobile-first responsive design
- **MetaMask Integration**: Seamless wallet connection for authentication

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Ant Design 5.0** with custom token configuration
- **React Router** for navigation
- **React Query** for server state management
- **fhevmjs** for FHE encryption
- **ethers.js** for blockchain interaction
- **Recharts** for data visualization

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── AppHeader.tsx
│   │   ├── SideNav.tsx
│   │   ├── VotingCard.tsx
│   │   ├── StatCard.tsx
│   │   └── EncryptionStatus.tsx
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── VotingList.tsx
│   │   ├── VotePage.tsx
│   │   ├── CreateVoting.tsx
│   │   ├── Results.tsx
│   │   └── AdminDashboard.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useFHE.ts
│   │   └── useWallet.ts
│   ├── services/         # API services
│   │   └── api.ts
│   ├── utils/            # Utility functions
│   │   ├── fhe.ts
│   │   └── wallet.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── styles/           # Styling
│   │   ├── theme.ts
│   │   └── index.css
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask browser extension
- Access to Zama Devnet (for FHE operations)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fhe-voting/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_FHE_NETWORK_URL=https://devnet.zama.ai
VITE_FHE_GATEWAY_URL=https://gateway.zama.ai
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Key Features Implementation

### FHE Encryption

Votes are encrypted client-side using the fhevmjs library:

```typescript
// Encrypt a vote choice
const encryptedVote = await encrypt(optionIndex);

// Encrypt with weight for weighted voting
const { choice, weight } = await encryptWeighted(optionIndex, voteWeight);
```

### Vote Verification

Users can verify their vote without revealing their choice:

```typescript
// Reencrypt vote for verification
const reencrypted = await reencryptVote(encryptedVote);
```

### Voting Types

1. **Single Choice**: Traditional one-person-one-vote
2. **Multiple Choice**: Select multiple options
3. **Weighted Voting**: Assign weights to different options
4. **Quadratic Voting**: Spend credits with quadratic cost

### Theme Configuration

The application uses Ant Design 5.0's token system for consistent theming:

```typescript
// Light theme tokens
{
  colorPrimary: '#2563EB',
  colorBgLayout: '#F7F9FC',
  borderRadius: 8,
  // ...
}

// Dark theme with algorithm
{
  algorithm: theme.darkAlgorithm,
  colorBgBase: '#0B0F14',
  // ...
}
```

## Security Considerations

- All votes are encrypted before leaving the client
- Private keys never leave the user's device
- MetaMask handles all transaction signing
- FHE ensures votes remain private even on-chain
- Collective decryption prevents individual vote exposure

## Performance Optimizations

- Code splitting with React.lazy for route-based splitting
- Optimized bundle with manual chunks for vendors
- Image lazy loading
- Virtual scrolling for large lists
- Memoization for expensive computations

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Please read the contribution guidelines before submitting pull requests.

## License

MIT License