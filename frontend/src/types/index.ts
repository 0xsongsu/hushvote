export interface User {
  address: string;
  isAdmin: boolean;
  votingPower?: number;
}

export enum VotingStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  TALLIED = 'tallied',
}

export enum VotingType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  WEIGHTED = 'weighted',
  QUADRATIC = 'quadratic',
}

export interface VotingOption {
  id: string;
  label: string;
  description?: string;
  encryptedCount?: string;
  decryptedCount?: number;
}

export interface Voting {
  id: string;
  title: string;
  description: string;
  type: VotingType;
  status: VotingStatus;
  options: VotingOption[];
  startTime: string;
  endTime: string;
  createdBy: string;
  totalVoters: number;
  eligibleVoters?: string[];
  quadraticCredits?: number;
  allowReencryption: boolean;
  decryptionThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedVote {
  votingId: string;
  voter: string;
  encryptedChoice: string;
  proof?: string;
  timestamp: string;
}

export interface VoteSubmission {
  votingId: string;
  optionId: string;
  weight?: number;
}

export interface DecryptionKey {
  votingId: string;
  keyShare: string;
  participant: string;
}

export interface VotingResult {
  votingId: string;
  results: {
    optionId: string;
    count: number;
    percentage: number;
  }[];
  totalVotes: number;
  decryptedAt?: string;
}