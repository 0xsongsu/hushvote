import { getAddress } from 'ethers';

// Contract addresses for HushVote (using getAddress to ensure proper checksum)
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  11155111: {
    FHEBallot: getAddress('0x0b07c7cd59eee60ae68989ba3f97210bf42a449c'),
    FHEQuadraticVoting: getAddress('0x2c5d2e0a35ce77001f638495e6e399765cc650c1'),
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
