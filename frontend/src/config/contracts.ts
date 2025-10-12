import { getAddress } from 'ethers';

// Contract addresses for HushVote (using getAddress to ensure proper checksum)
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  11155111: {
    FHEBallot: getAddress('0xa7D3cdfDe2E3A6bB7c68bC4Ffe747f00828d14b2'),
    FHEQuadraticVoting: getAddress('0x4E2a4FcE9Fc70f970665E1F99A01C63a3385F928'),
  },
  // Local development
  31337: {
    FHEBallot: '',
    FHEQuadraticVoting: '',
  }
};

export const SUPPORTED_CHAINS = {
  SEPOLIA: 11155111,
  LOCALHOST: 31337,
};

export const DEFAULT_CHAIN = SUPPORTED_CHAINS.SEPOLIA;

// RPC URLs
export const RPC_URLS = {
  // Use your Infura Sepolia RPC for reliable read calls (logs, etc.)
  [SUPPORTED_CHAINS.SEPOLIA]: 'https://sepolia.infura.io/v3/1d4b7fd7fa354aeca092b2420b0cf09f',
  [SUPPORTED_CHAINS.LOCALHOST]: 'http://localhost:8545',
};

// Block Explorer URLs
export const EXPLORER_URLS = {
  [SUPPORTED_CHAINS.SEPOLIA]: 'https://sepolia.etherscan.io',
  [SUPPORTED_CHAINS.LOCALHOST]: '',
};
