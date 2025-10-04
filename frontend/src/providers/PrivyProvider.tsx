import React from 'react';
import { PrivyProvider as Provider } from '@privy-io/react-auth';
import { sepolia } from 'viem/chains';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'clxuob3vn00k9kp0ftabvfvea'; // Demo app ID

interface PrivyProviderProps {
  children: React.ReactNode;
}

export const PrivyProvider: React.FC<PrivyProviderProps> = ({ children }) => {
  return (
    <Provider
      appId={PRIVY_APP_ID}
      config={{
        // Appearance configuration
        appearance: {
          theme: 'light',
          accentColor: '#2563EB',
          logo: '/logo.svg',
          showWalletLoginFirst: false,
        },
        // Login methods - support multiple wallet types
        loginMethods: [
          'wallet',      // All EVM wallets
          'email',       // Email login
          'google',      // Google OAuth
          'twitter',     // Twitter OAuth
          'discord',     // Discord OAuth
          'apple',       // Apple OAuth
        ],
        // Supported chains
        defaultChain: sepolia,
        supportedChains: [sepolia],
        // Wallet configuration
        walletConnectCloudProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
        // Embedded wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
          showWalletUIs: true,
        },
        // Events
        onSuccess: () => {
          console.log('Privy login successful');
        },
      }}
    >
      {children}
    </Provider>
  );
};