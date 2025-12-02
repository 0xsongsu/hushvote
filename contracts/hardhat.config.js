require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@fhevm/hardhat-plugin");
require("dotenv").config();

// Tasks
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);
    console.log(hre.ethers.formatEther(balance), "ETH");
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: false,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      evmVersion: "paris",
      metadata: {
        bytecodeHash: "ipfs"
      }
    }
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      gas: 12000000,
      blockGasLimit: 12000000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
        accountsBalance: "10000000000000000000000"
      }
    },
    
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000
    },
    
    // Zama Devnet configuration
    zama: {
      url: process.env.ZAMA_RPC_URL || "https://devnet.zama.ai",
      chainId: 8009,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      gas: 8000000,
      timeout: 120000
    },
    
    // Ethereum testnets
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto"
    },
    
    goerli: {
      url: process.env.GOERLI_RPC_URL || `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 5,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto"
    },
    
    // Polygon Mumbai testnet
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 35000000000,
      gas: 8000000
    }
  },
  
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || ""
    }
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    excludeContracts: [],
    src: "./contracts",
    outputFile: "gas-report.txt",
    noColors: false
  },
  
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: []
  },
  
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  mocha: {
    timeout: 120000 // 2 minutes timeout for FHE operations
  },
  
  // FHE-specific configuration
  fhevm: {
    networkUrl: process.env.ZAMA_RPC_URL || "https://devnet.zama.ai",
    gatewayUrl: process.env.ZAMA_GATEWAY_URL || "https://gateway.devnet.zama.ai",
    aclAddress: process.env.ACL_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000001",
    tfheExecutorAddress: process.env.TFHE_EXECUTOR_ADDRESS || "0x0000000000000000000000000000000000000002",
    kmsVerifierAddress: process.env.KMS_VERIFIER_ADDRESS || "0x0000000000000000000000000000000000000003"
  }
};