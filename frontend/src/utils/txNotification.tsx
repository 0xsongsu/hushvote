import React from 'react';
import { notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
import { EXPLORER_URLS, SUPPORTED_CHAINS } from '../config/contracts';

// Get explorer URL for transaction
export function getTxExplorerUrl(txHash: string, chainId: number = SUPPORTED_CHAINS.SEPOLIA): string {
  const baseUrl = EXPLORER_URLS[chainId] || EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA];
  return `${baseUrl}/tx/${txHash}`;
}

// Shorten transaction hash for display
export function shortenTxHash(hash: string, chars: number = 6): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

// Render clickable transaction link
const TxLink: React.FC<{ txHash: string; chainId?: number }> = ({ txHash, chainId }) => {
  const url = getTxExplorerUrl(txHash, chainId);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#1890ff', display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <LinkOutlined />
      View on Explorer ({shortenTxHash(txHash)})
    </a>
  );
};

// Transaction notification types
export type TxNotificationType = 'pending' | 'success' | 'error';

interface TxNotificationOptions {
  type: TxNotificationType;
  title: string;
  description?: string;
  txHash?: string;
  chainId?: number;
  duration?: number;
}

// Unique key generator for notifications
let notificationKeyCounter = 0;
const generateKey = () => `tx-notification-${++notificationKeyCounter}`;

/**
 * Show transaction notification with explorer link
 */
export function showTxNotification(options: TxNotificationOptions): string {
  const { type, title, description, txHash, chainId, duration } = options;
  const key = generateKey();

  const icons = {
    pending: <LoadingOutlined style={{ color: '#1890ff' }} />,
    success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  };

  const defaultDurations = {
    pending: 0, // Don't auto-close pending
    success: 6,
    error: 8,
  };

  notification.open({
    key,
    message: title,
    description: (
      <div>
        {description && <div style={{ marginBottom: txHash ? 8 : 0 }}>{description}</div>}
        {txHash && <TxLink txHash={txHash} chainId={chainId} />}
      </div>
    ),
    icon: icons[type],
    duration: duration !== undefined ? duration : defaultDurations[type],
    placement: 'topRight',
  });

  return key;
}

/**
 * Update an existing notification (e.g., from pending to success/error)
 */
export function updateTxNotification(key: string, options: TxNotificationOptions): void {
  const { type, title, description, txHash, chainId, duration } = options;

  const icons = {
    pending: <LoadingOutlined style={{ color: '#1890ff' }} />,
    success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  };

  const defaultDurations = {
    pending: 0,
    success: 6,
    error: 8,
  };

  notification.open({
    key,
    message: title,
    description: (
      <div>
        {description && <div style={{ marginBottom: txHash ? 8 : 0 }}>{description}</div>}
        {txHash && <TxLink txHash={txHash} chainId={chainId} />}
      </div>
    ),
    icon: icons[type],
    duration: duration !== undefined ? duration : defaultDurations[type],
    placement: 'topRight',
  });
}

/**
 * Close a notification by key
 */
export function closeTxNotification(key: string): void {
  notification.destroy(key);
}

/**
 * Helper to handle transaction lifecycle with notifications
 * Shows pending -> success/error notifications automatically
 */
export async function withTxNotification<T>(
  action: string,
  txPromise: Promise<{ hash: string; wait: () => Promise<any> }>,
  options?: {
    chainId?: number;
    onSuccess?: (receipt: any) => void;
    onError?: (error: any) => void;
  }
): Promise<T | null> {
  const { chainId, onSuccess, onError } = options || {};
  let notificationKey: string | null = null;

  try {
    // Show pending notification
    notificationKey = showTxNotification({
      type: 'pending',
      title: `${action} - Pending`,
      description: 'Waiting for wallet confirmation...',
      chainId,
    });

    // Wait for transaction to be sent
    const tx = await txPromise;

    // Update to show transaction submitted
    updateTxNotification(notificationKey, {
      type: 'pending',
      title: `${action} - Submitted`,
      description: 'Transaction submitted. Waiting for confirmation...',
      txHash: tx.hash,
      chainId,
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    // Check if transaction was successful
    if (receipt.status === 1) {
      updateTxNotification(notificationKey, {
        type: 'success',
        title: `${action} - Confirmed`,
        description: 'Transaction confirmed successfully!',
        txHash: tx.hash,
        chainId,
      });
      onSuccess?.(receipt);
      return receipt as T;
    } else {
      throw new Error('Transaction failed on-chain');
    }
  } catch (error: any) {
    const errorMessage = error?.shortMessage || error?.reason || error?.message || 'Transaction failed';

    if (notificationKey) {
      updateTxNotification(notificationKey, {
        type: 'error',
        title: `${action} - Failed`,
        description: errorMessage,
        txHash: error?.transactionHash || error?.receipt?.hash,
        chainId,
      });
    } else {
      showTxNotification({
        type: 'error',
        title: `${action} - Failed`,
        description: errorMessage,
        chainId,
      });
    }

    onError?.(error);
    throw error;
  }
}

export default {
  show: showTxNotification,
  update: updateTxNotification,
  close: closeTxNotification,
  withTx: withTxNotification,
  getTxUrl: getTxExplorerUrl,
  shortenHash: shortenTxHash,
};
