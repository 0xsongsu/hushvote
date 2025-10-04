// Contract addresses for HushVote
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  11155111: {
    FHEBallot: '0x0B07c7cD59eeE60AE68989bA3F97210Bf42A449C',
    FHEQuadraticVoting: '0x2c5d2e0a35CE77001F638495e6e399765CC650C1',
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
