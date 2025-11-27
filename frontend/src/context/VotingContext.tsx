import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllVotingsWithUserStatus, VotingData } from '../services/contractService';
import { useWallet } from '../hooks/useWallet';

// Status enum matching contract
export enum VotingStatusEnum {
  PENDING = 0,
  ACTIVE = 1,
  ENDED = 2,
  TALLIED = 3,
}

export interface VotingContextValue {
  // Data
  votings: VotingData[];
  userVoteStatus: Map<string, boolean>;

  // Loading states
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;

  // Computed values
  activeVotings: VotingData[];
  pendingVotings: VotingData[];
  endedVotings: VotingData[];
  talliedVotings: VotingData[];

  // Stats
  stats: {
    total: number;
    active: number;
    pending: number;
    ended: number;
    tallied: number;
    totalVotes: number;
  };

  // Helpers
  getVotingById: (source: string, id: number) => VotingData | undefined;
  hasUserVoted: (source: string, id: number) => boolean;
  getVotingStatus: (voting: VotingData) => VotingStatusEnum;
}

const VotingContext = createContext<VotingContextValue | undefined>(undefined);

interface VotingProviderProps {
  children: ReactNode;
}

export const VotingProvider: React.FC<VotingProviderProps> = ({ children }) => {
  const { wallet, isConnected } = useWallet();
  const queryClient = useQueryClient();

  // Fetch all votings with user status using optimized batch reading
  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['all-votings', wallet?.address],
    queryFn: async () => {
      const result = await getAllVotingsWithUserStatus(wallet?.address);
      return result;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Auto-refresh every minute
    enabled: true, // Always fetch, even without wallet (will get empty user status)
  });

  const votings = data?.votings || [];
  const userVoteStatus = data?.userVoteStatus || new Map<string, boolean>();

  // Helper to determine voting status
  const getVotingStatus = useCallback((voting: VotingData): VotingStatusEnum => {
    const status = (voting as any).status;
    if (status !== undefined) {
      return status as VotingStatusEnum;
    }
    // Fallback to time-based calculation
    const now = Math.floor(Date.now() / 1000);
    if (now < voting.startTime) return VotingStatusEnum.PENDING;
    if (now <= voting.endTime) return VotingStatusEnum.ACTIVE;
    return VotingStatusEnum.ENDED;
  }, []);

  // Categorized votings
  const activeVotings = useMemo(() =>
    votings.filter(v => getVotingStatus(v) === VotingStatusEnum.ACTIVE),
    [votings, getVotingStatus]
  );

  const pendingVotings = useMemo(() =>
    votings.filter(v => getVotingStatus(v) === VotingStatusEnum.PENDING),
    [votings, getVotingStatus]
  );

  const endedVotings = useMemo(() =>
    votings.filter(v => getVotingStatus(v) === VotingStatusEnum.ENDED),
    [votings, getVotingStatus]
  );

  const talliedVotings = useMemo(() =>
    votings.filter(v => getVotingStatus(v) === VotingStatusEnum.TALLIED),
    [votings, getVotingStatus]
  );

  // Stats
  const stats = useMemo(() => ({
    total: votings.length,
    active: activeVotings.length,
    pending: pendingVotings.length,
    ended: endedVotings.length,
    tallied: talliedVotings.length,
    totalVotes: votings.reduce((sum, v) => sum + (v.totalVotes || 0), 0),
  }), [votings, activeVotings, pendingVotings, endedVotings, talliedVotings]);

  // Get voting by source and ID
  const getVotingById = useCallback((source: string, id: number): VotingData | undefined => {
    return votings.find(v => (v as any).source === source && v.id === id);
  }, [votings]);

  // Check if user has voted
  const hasUserVoted = useCallback((source: string, id: number): boolean => {
    return userVoteStatus.get(`${source}-${id}`) || false;
  }, [userVoteStatus]);

  // Refresh function
  const refresh = useCallback(async () => {
    await refetch();
    // Also invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['voting-onchain'] });
    queryClient.invalidateQueries({ queryKey: ['admin-votings-onchain'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-votings'] });
  }, [refetch, queryClient]);

  const value: VotingContextValue = {
    votings,
    userVoteStatus,
    isLoading,
    isRefetching,
    error: error as Error | null,
    refresh,
    activeVotings,
    pendingVotings,
    endedVotings,
    talliedVotings,
    stats,
    getVotingById,
    hasUserVoted,
    getVotingStatus,
  };

  return (
    <VotingContext.Provider value={value}>
      {children}
    </VotingContext.Provider>
  );
};

// Custom hook to use voting context
export const useVotingContext = (): VotingContextValue => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVotingContext must be used within a VotingProvider');
  }
  return context;
};

// Convenience hooks
export const useVotings = () => {
  const { votings, isLoading, error, refresh } = useVotingContext();
  return { votings, isLoading, error, refresh };
};

export const useVotingStats = () => {
  const { stats, isLoading } = useVotingContext();
  return { stats, isLoading };
};

export const useActiveVotings = () => {
  const { activeVotings, isLoading } = useVotingContext();
  return { activeVotings, isLoading };
};

export const useUserVoteStatus = (source: string, id: number) => {
  const { hasUserVoted } = useVotingContext();
  return hasUserVoted(source, id);
};
