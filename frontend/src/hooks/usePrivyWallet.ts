import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';

export interface WalletInfo {
  address: string;
  chainId: number;
  balance?: string;
  provider?: any;
}

export function usePrivyWallet() {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout,
    linkWallet,
    unlinkWallet 
  } = usePrivy();
  
  const { wallets, ready: walletsReady } = useWallets();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Get active wallet
  const activeWallet = wallets.find(w => w.walletClientType !== 'privy');

  useEffect(() => {
    if (authenticated && activeWallet) {
      setWallet({
        address: activeWallet.address,
        chainId: activeWallet.chainId || 11155111, // Default to Sepolia
        provider: activeWallet.getEthereumProvider?.(),
      });
    } else {
      setWallet(null);
    }
  }, [authenticated, activeWallet]);

  const connect = useCallback(async () => {
    if (!ready) {
      message.warning('Wallet provider is not ready');
      return;
    }

    setIsConnecting(true);
    try {
      await login();
      message.success('Wallet connected successfully');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      message.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [ready, login]);

  const disconnect = useCallback(async () => {
    try {
      await logout();
      setWallet(null);
      message.success('Wallet disconnected');
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      message.error('Failed to disconnect wallet');
    }
  }, [logout]);

  const switchNetwork = useCallback(async (chainId: number) => {
    if (!activeWallet) {
      message.error('No wallet connected');
      return;
    }

    try {
      await activeWallet.switchChain(chainId);
      message.success('Network switched successfully');
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      message.error('Failed to switch network');
    }
  }, [activeWallet]);

  const linkAdditionalWallet = useCallback(async () => {
    try {
      await linkWallet();
      message.success('Additional wallet linked successfully');
    } catch (error: any) {
      console.error('Failed to link wallet:', error);
      message.error('Failed to link additional wallet');
    }
  }, [linkWallet]);

  const getConnectedWallets = useCallback(() => {
    return wallets.map(w => ({
      address: w.address,
      type: w.walletClientType,
      chainId: w.chainId,
    }));
  }, [wallets]);

  return {
    wallet,
    isConnected: authenticated && !!activeWallet,
    isConnecting,
    user,
    wallets: getConnectedWallets(),
    connect,
    disconnect,
    switchNetwork,
    linkAdditionalWallet,
    ready: ready && walletsReady,
  };
}