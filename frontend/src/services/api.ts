import axios from 'axios';
import { 
  Voting, 
  VotingType, 
  VotingStatus, 
  EncryptedVote, 
  VoteSubmission,
  DecryptionKey,
  VotingResult 
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Voting endpoints
export const votingApi = {
  async getAll(): Promise<Voting[]> {
    const response = await api.get('/votings');
    return response.data;
  },

  async getById(id: string): Promise<Voting> {
    const response = await api.get(`/votings/${id}`);
    return response.data;
  },

  async create(data: {
    title: string;
    description: string;
    type: VotingType;
    options: string[];
    startTime: string;
    endTime: string;
    eligibleVoters?: string[];
    quadraticCredits?: number;
    allowReencryption: boolean;
    decryptionThreshold?: number;
  }): Promise<Voting> {
    const response = await api.post('/votings', data);
    return response.data;
  },

  async update(id: string, data: Partial<Voting>): Promise<Voting> {
    const response = await api.put(`/votings/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/votings/${id}`);
  },

  async updateStatus(id: string, status: VotingStatus): Promise<Voting> {
    const response = await api.patch(`/votings/${id}/status`, { status });
    return response.data;
  },
};

// Vote endpoints
export const voteApi = {
  async submit(data: {
    votingId: string;
    encryptedChoice: string;
    encryptedWeight?: string;
    proof?: string;
  }): Promise<EncryptedVote> {
    const response = await api.post('/votes', data);
    return response.data;
  },

  async verify(votingId: string, voter: string): Promise<{
    voted: boolean;
    reencrypted?: string;
  }> {
    const response = await api.get(`/votes/verify/${votingId}/${voter}`);
    return response.data;
  },

  async getVoterStatus(votingId: string, voter: string): Promise<{
    hasVoted: boolean;
    timestamp?: string;
    canReencrypt: boolean;
  }> {
    const response = await api.get(`/votes/status/${votingId}/${voter}`);
    return response.data;
  },
};

// Results endpoints
export const resultsApi = {
  async submitDecryptionKey(data: DecryptionKey): Promise<void> {
    await api.post('/results/decrypt', data);
  },

  async getResults(votingId: string): Promise<VotingResult> {
    const response = await api.get(`/results/${votingId}`);
    return response.data;
  },

  async getPartialResults(votingId: string): Promise<{
    totalVotes: number;
    participationRate: number;
  }> {
    const response = await api.get(`/results/${votingId}/partial`);
    return response.data;
  },
};

// Admin endpoints
export const adminApi = {
  async getStats(): Promise<{
    totalVotings: number;
    activeVotings: number;
    totalVotes: number;
    totalUsers: number;
  }> {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getVotingDetails(votingId: string): Promise<{
    voting: Voting;
    votes: number;
    participants: string[];
    decryptionProgress: number;
  }> {
    const response = await api.get(`/admin/votings/${votingId}`);
    return response.data;
  },

  async initiateDecryption(votingId: string): Promise<void> {
    await api.post(`/admin/votings/${votingId}/decrypt`);
  },
};

// API for interacting with smart contracts
export const mockApi = {
  async getVotings(): Promise<Voting[]> {
    // No mock data - will fetch from smart contract
    // TODO: Implement contract integration
    return [];
  },
};