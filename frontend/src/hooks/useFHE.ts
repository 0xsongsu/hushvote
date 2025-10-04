import { useState, useEffect, useCallback } from 'react';
import { initializeFHE, encryptVote, encryptWeightedVote, encryptMultipleOptions, reencryptVote } from '../utils/fhe';
import { message } from 'antd';

export function useFHE() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await initializeFHE();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError('Failed to initialize FHE. Please check your connection.');
        message.error('FHE initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const encrypt = useCallback(async (optionIndex: number, contractAddress: string, userAddress: string) => {
    if (!isInitialized) {
      throw new Error('FHE not initialized');
    }
    return await encryptVote(optionIndex, contractAddress, userAddress);
  }, [isInitialized]);

  const encryptWeighted = useCallback(async (optionIndex: number, weight: number, contractAddress: string, userAddress: string) => {
    if (!isInitialized) {
      throw new Error('FHE not initialized');
    }
    return await encryptWeightedVote(optionIndex, weight, contractAddress, userAddress);
  }, [isInitialized]);

  const reencrypt = useCallback(async (encryptedData: string) => {
    if (!isInitialized) {
      throw new Error('FHE not initialized');
    }
    return await reencryptVote(encryptedData);
  }, [isInitialized]);

  return {
    isInitialized,
    isLoading,
    error,
    encrypt,
    encryptWeighted,
    encryptMultipleOptions,
    reencrypt,
  };
}
