import { getAddress } from 'ethers';

// Contract addresses for HushVote (using getAddress to ensure proper checksum)
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet - Deployed Dec 5, 2025
  11155111: {
    FHEBallot: getAddress('0x14F44201Cb91929e4dddB5455DE26B720A81d327'),
    FHEQuadraticVoting: getAddress('0x9a075d9a70Cb72884Abf2c42bd48497b1125510e'),
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
