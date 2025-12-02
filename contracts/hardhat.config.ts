import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
          evmVersion: "cancun",
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      initialBaseFeePerGas: 0,
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
        accountsBalance: "10000000000000000000000"
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: "auto",
      gasPrice: 2000000000,
      timeout: 60000
    },
    // Sepolia with FHE support (via Zama's FHE plugin)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
      gas: "auto"
    },
    // Zama Devnet for full FHE support
    zama: {
      url: process.env.ZAMA_DEVNET_RPC_URL || "https://devnet.zama.ai",
      chainId: 8009,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      gas: 8000000,
      timeout: 120000
    },
    // Other testnets
    goerli: {
      url: process.env.GOERLI_RPC_URL || `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 5,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto"
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
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
    src: "./src",
    outputFile: "reports/gas-report.txt",
    noColors: false,
    showMethodSig: true
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
  }
  // FHE 0.9.1 uses ZamaEthereumConfig which auto-resolves addresses by chainId
};

export default config;