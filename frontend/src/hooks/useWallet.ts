import { useState, useEffect, useCallback } from 'react';
import { connectWallet, switchNetwork, WalletInfo } from '../utils/wallet';
import { RELAYER_CONFIG } from '../utils/fhe';
import { message } from 'antd';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            const walletInfo = await connectWallet();
            setWallet(walletInfo);
          }
        } catch (err) {
          console.error('Failed to check wallet connection:', err);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setWallet(null);
        } else {
          checkConnection();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletInfo = await connectWallet();
      
      // Check if on correct network (Sepolia)
      if (walletInfo.chainId !== RELAYER_CONFIG.CHAIN_ID) {
        message.info('Switching to Sepolia...');
        await switchNetwork(RELAYER_CONFIG.CHAIN_ID);
        // Reconnect after network switch
        const updatedWallet = await connectWallet();
        setWallet(updatedWallet);
      } else {
        setWallet(walletInfo);
      }
      
      message.success('Wallet connected successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      message.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    message.info('Wallet disconnected');
  }, []);

  const ensureCorrectNetwork = useCallback(async () => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
    if (wallet.chainId !== RELAYER_CONFIG.CHAIN_ID) {
      await switchNetwork(RELAYER_CONFIG.CHAIN_ID);
      const updatedWallet = await connectWallet();
      setWallet(updatedWallet);
    }
  }, [wallet]);

  return {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
    ensureCorrectNetwork,
    isConnected: !!wallet,
  };
}
