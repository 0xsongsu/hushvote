import { ethers } from 'ethers';

export interface WalletInfo {
  address: string;
  chainId: number;
  balance: string;
}

export async function connectWallet(): Promise<WalletInfo> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    return {
      address,
      chainId: Number(network.chainId),
      balance: ethers.formatEther(balance),
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

export async function switchNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      await addNetwork(chainId);
    } else {
      throw error;
    }
  }
}

async function addNetwork(chainId: number): Promise<void> {
  const networks: Record<number, any> = {
    11155111: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia',
      nativeCurrency: {
        name: 'SepoliaETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://1rpc.io/sepolia'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
  };

  const network = networks[chainId];
  if (!network) {
    throw new Error(`Network configuration not found for chainId ${chainId}`);
  }

  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [network],
  });
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export async function signMessage(message: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return await signer.signMessage(message);
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}