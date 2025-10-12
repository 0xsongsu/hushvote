import { ethers } from 'ethers';
import FHEBallotABI from '../abi/FHEBallot.json';
import FHEQuadraticVotingABI from '../abi/FHEQuadraticVoting.json';
import { CONTRACT_ADDRESSES, SUPPORTED_CHAINS, RPC_URLS } from '../config/contracts';

// Contract instances
let contractInstance: ethers.Contract | null = null; // FHEBallot
let quadraticContractInstance: ethers.Contract | null = null; // FHEQuadraticVoting
let providerInstance: ethers.BrowserProvider | null = null;
let readProvider: ethers.Provider | null = null;
let initPromise: Promise<any> | null = null;

export interface VotingData {
  id: number;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  creator: string;
  votingType: number;
  numOptions: number;
  totalVotes: number;
  isActive: boolean;
  source?: 'ballot' | 'quadratic';
}

// Initialize contract connection
export async function initializeContract() {
  try {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }

    // Connect to provider
    providerInstance = new ethers.BrowserProvider(window.ethereum);
    
    // Get network
    const network = await providerInstance.getNetwork();
    const chainId = Number(network.chainId);
    
    // Check if we're on Sepolia
    if (chainId !== SUPPORTED_CHAINS.SEPOLIA) {
      throw new Error('Please connect to Sepolia network');
    }
    
    // Get signer
    const signer = await providerInstance.getSigner();

    // Build read-only provider for log queries
    try {
      const url = RPC_URLS[chainId as keyof typeof RPC_URLS] || RPC_URLS[SUPPORTED_CHAINS.SEPOLIA];
      if (url) readProvider = new ethers.JsonRpcProvider(url);
    } catch {}
    
    // Get contract addresses
    const addresses = CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA];
    const ballotAddress = addresses.FHEBallot;
    const quadraticAddress = addresses.FHEQuadraticVoting;

    if (!ballotAddress) {
      throw new Error('FHEBallot not deployed on this network');
    }

    // Create contract instances
    contractInstance = new ethers.Contract(ballotAddress, FHEBallotABI.abi, signer);
    if (quadraticAddress) {
      quadraticContractInstance = new ethers.Contract(quadraticAddress, FHEQuadraticVotingABI.abi, signer);
    }

    console.log('FHEBallot initialized at:', ballotAddress);
    if (quadraticContractInstance) console.log('FHEQuadraticVoting initialized at:', quadraticAddress);
    return contractInstance;
  } catch (error) {
    console.error('Failed to initialize contract:', error);
    throw error;
  }
}

export async function ensureInitialized() {
  if (contractInstance) return;
  if (!initPromise) {
    initPromise = initializeContract().catch((e) => {
      initPromise = null;
      throw e;
    });
  }
  await initPromise;
}

// Get contract instance
export function getContract(): ethers.Contract {
  if (!contractInstance) {
    throw new Error('Contract not initialized. Call initializeContract() first.');
  }
  return contractInstance;
}

export function getQuadraticContract(): ethers.Contract {
  if (!quadraticContractInstance) {
    throw new Error('Quadratic contract not initialized. Call initializeContract() first.');
  }
  return quadraticContractInstance;
}

function getReadProvider(): ethers.Provider {
  if (readProvider) return readProvider;
  const url = RPC_URLS[SUPPORTED_CHAINS.SEPOLIA];
  readProvider = new ethers.JsonRpcProvider(url);
  return readProvider;
}

function getReadBallot() {
  const p = getReadProvider();
  const addr = CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEBallot;
  return new ethers.Contract(addr, FHEBallotABI.abi, p);
}

function getReadQuadratic() {
  const p = getReadProvider();
  const addr = CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEQuadraticVoting;
  return new ethers.Contract(addr, FHEQuadraticVotingABI.abi, p);
}

// Build EIP-1559 fee + gasLimit overrides to improve confirmation time on Sepolia
async function buildTxOverrides(
  contract: ethers.Contract,
  method: string,
  args: any[]
): Promise<any> {
  const overrides: any = {};
  try {
    if (providerInstance) {
      const fee = await providerInstance.getFeeData();
      const minPriority = ethers.parseUnits('2', 'gwei');
      const priority = fee.maxPriorityFeePerGas && fee.maxPriorityFeePerGas > minPriority
        ? fee.maxPriorityFeePerGas
        : minPriority;
      const defaultMax = ethers.parseUnits('30', 'gwei');
      const base = fee.maxFeePerGas || fee.gasPrice || defaultMax;
      const maxFee = base * 2n + priority;
      overrides.maxPriorityFeePerGas = priority;
      overrides.maxFeePerGas = maxFee;
    }
  } catch {}

  try {
    const estimator = (contract.estimateGas as any)[method];
    if (typeof estimator === 'function') {
      const est: bigint = await estimator(...args, overrides);
      overrides.gasLimit = est + (est / 5n); // +20%
    }
  } catch {}
  return overrides;
}

// Create a new voting
export async function createVoting(
  title: string,
  description: string,
  options: string[],
  optionDescriptions: string[],
  startTime: number,
  endTime: number,
  votingType: number = 0
): Promise<number> {
  try {
    await ensureInitialized();
    // Use Quadratic contract for quadratic votings
    const contract = votingType === 3 ? getQuadraticContract() : getContract();
    
    // Create voting config struct
    const votingConfig = {
      name: title,
      description: description,
      voteType: votingType, // 0 = SINGLE_CHOICE, 1 = MULTIPLE_CHOICE, 2 = WEIGHTED
      startTime: startTime,
      endTime: endTime,
      quorum: 1, // Minimum 1 vote required
      whitelistEnabled: false, // No whitelist
      maxVotersCount: 1000000 // Large number for unlimited voters
    };
    
    // Use provided option names and descriptions
    const optionNames = options;
    
    // Call createVoting function with struct and arrays, with EIP-1559 + gasLimit overrides
    const overrides = await buildTxOverrides(contract, 'createVoting', [votingConfig, optionNames, optionDescriptions]);
    const tx = await contract.createVoting(
      votingConfig,
      optionNames,
      optionDescriptions,
      overrides
    );
    
    // Wait for transaction confirmation
  const receipt = await tx.wait();
    
    // Get voting ID from events
    const event = receipt.logs.find((log: any) => {
      try {
        const parsedLog = contract.interface.parseLog(log);
        return parsedLog?.name === 'VotingCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsedEvent = contract.interface.parseLog(event);
      const newId = Number(parsedEvent?.args?.votingId || 0);
      // Best-effort cache update
      try {
        const source = votingType === 3 ? 'quadratic' : 'ballot';
        const fresh = await getVotingFrom(source as any, newId);
        const cacheKey = `hv:votings:${CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEBallot}:${CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEQuadraticVoting}`;
        const cached = loadCache<VotingData[]>(cacheKey);
        const next = cached?.data ? [...cached.data] : [];
        if (!next.find((v) => v.id === newId && (v as any).source === source)) {
          next.unshift(fresh);
          saveCache(cacheKey, next);
        }
      } catch {}
      return newId;
    }
    
    // If no event found, get current voting counter
    const votingCounter = await contract.votingCounter();
    const fallbackId = Number(votingCounter) - 1;
    try {
      const source = votingType === 3 ? 'quadratic' : 'ballot';
      const fresh = await getVotingFrom(source as any, fallbackId);
      const cacheKey = `hv:votings:${CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEBallot}:${CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEQuadraticVoting}`;
      const cached = loadCache<VotingData[]>(cacheKey);
      const next = cached?.data ? [...cached.data] : [];
      if (!next.find((v) => v.id === fallbackId && (v as any).source === source)) {
        next.unshift(fresh);
        saveCache(cacheKey, next);
      }
    } catch {}
    return fallbackId;
  } catch (error) {
    console.error('Failed to create voting:', error);
    throw error;
  }
}

// Cast a vote
export async function castVote(
  votingId: number,
  encryptedVote: string,
  proof?: string
): Promise<void> {
  try {
    await ensureInitialized();
    const contract = getContract();
    
    // Convert encrypted vote hex string to raw bytes
    const voteBytes = ethers.getBytes(encryptedVote);
    
    // Call castVote function
    const proofBytes = proof
      ? (proof.startsWith('0x') ? ethers.getBytes(proof) : ethers.toUtf8Bytes(proof))
      : '0x';
    const overrides = await buildTxOverrides(contract, 'castVote', [votingId, voteBytes, proofBytes]);
    const tx = await contract.castVote(
      votingId,
      voteBytes,
      proofBytes,
      overrides
    );
    
    // Wait for transaction confirmation
    await tx.wait();
    
    console.log('Vote cast successfully');
  } catch (error) {
    console.error('Failed to cast vote:', error);
    throw error;
  }
}

// Cast a weighted vote (voteType == 2)
export async function castWeightedVote(
  votingId: number,
  encryptedVote: string,
  weight: number,
  proof?: string
): Promise<void> {
  try {
    await ensureInitialized();
    const contract = getContract();
    const voteBytes = ethers.getBytes(encryptedVote);
    const proofBytes = proof
      ? (proof.startsWith('0x') ? ethers.getBytes(proof) : ethers.toUtf8Bytes(proof))
      : '0x';
    const overrides = await buildTxOverrides(contract, 'castWeightedVote', [votingId, voteBytes, weight, proofBytes]);
    const tx = await contract.castWeightedVote(
      votingId,
      voteBytes,
      weight,
      proofBytes,
      overrides
    );
    await tx.wait();
  } catch (error) {
    console.error('Failed to cast weighted vote:', error);
    throw error;
  }
}

// Get voting details
export async function getVoting(votingId: number): Promise<VotingData> {
  try {
    await ensureInitialized();
    const build = async (c: ethers.Contract): Promise<VotingData> => {
      const config = await c.getVotingConfig(votingId);
      const options: string[] = await c.getVotingOptions(votingId);
      const status: number = await c.getVotingStatus(votingId);
      const startTime = Number(config.startTime || 0);
      const endTime = Number(config.endTime || 0);
      const now = Math.floor(Date.now() / 1000);
      let totalVotes = 0;
      try {
        const total = await c.getTotalVoters(votingId);
        totalVotes = Number(total);
      } catch {}
      return {
        id: votingId,
        title: config.name || '',
        description: config.description || '',
        options,
        startTime,
        endTime,
        creator: '',
        votingType: Number(config.voteType || 0),
        numOptions: options.length,
        totalVotes,
        isActive: status === 1 || (now >= startTime && now <= endTime),
      };
    };

    try {
      return await build(getContract());
    } catch {
      return await build(getQuadraticContract());
    }
  } catch (error) {
    console.error('Failed to get voting:', error);
    throw error;
  }
}

// Get voting details from a specific contract source
export async function getVotingFrom(source: 'ballot' | 'quadratic', votingId: number): Promise<VotingData> {
  // Prefer read-only provider to avoid wallet dependency for listing
  const c = source === 'quadratic' ? getReadQuadratic() : getReadBallot();
  const config = await c.getVotingConfig(votingId);
  const options: string[] = await c.getVotingOptions(votingId);
  const status: number = await c.getVotingStatus(votingId);

  const startTime = Number(config.startTime || 0);
  const endTime = Number(config.endTime || 0);
  const now = Math.floor(Date.now() / 1000);

  let totalVotes = 0;
  try {
    const total = await c.getTotalVoters(votingId);
    totalVotes = Number(total);
  } catch {}

  // Heuristic: filter out non-existent slots (default/empty struct)
  const emptyStruct =
    (!config.name || config.name.length === 0) &&
    Number(config.startTime) === 0 &&
    Number(config.endTime) === 0 &&
    options.length === 0;
  if (emptyStruct) {
    // throw to allow caller to skip this id silently
    throw new Error('voting_not_exists');
  }

  return {
    id: votingId,
    title: config.name || '',
    description: config.description || '',
    options,
    startTime,
    endTime,
    creator: '',
    votingType: Number(config.voteType || 0),
    numOptions: options.length,
    totalVotes,
    isActive: status === 1 || (now >= startTime && now <= endTime),
    source,
  };
}

// Get all votings
export async function getAllVotings(): Promise<VotingData[]> {
  try {
    const list: VotingData[] = [];

    // Enumerate FHEBallot
    try {
      const ballot = getReadBallot();
      try {
        const ballotCount = Number(await (ballot as any).votingCounter());
        for (let i = 0; i < ballotCount; i++) {
          try { list.push(await getVotingFrom('ballot', i)); } catch {}
        }
      } catch {
        // Fallback: use VotingCreated events via queryFilter (more compatible)
        const latest = await getReadProvider().getBlockNumber();
        const fromBlock = latest > 100000 ? latest - 100000 : 0; // limit window to speed up
        let logs: any[] = [];
        try {
          logs = await ballot.queryFilter('VotingCreated', fromBlock, latest);
        } catch (e) {
          // ignore and fallback to probing
        }
        const ids = Array.from(new Set(logs.map(l => Number(l.args?.votingId)).filter(n => Number.isFinite(n))));
        if (ids.length > 0) {
          // Probe dense range 0..maxId to catch any missed ids
          const maxId = Math.max(...ids);
          for (let i = 0; i <= Math.max(maxId, 10); i++) {
            try { list.push(await getVotingFrom('ballot', i)); } catch {}
          }
        } else {
          // Final fallback: probe 0..25
          for (let i = 0; i < 25; i++) {
            try { list.push(await getVotingFrom('ballot', i)); } catch {}
          }
        }
      }
    } catch {}

    // Enumerate FHEQuadraticVoting
    try {
      const quad = getReadQuadratic();
      try {
        const quadCount = Number(await (quad as any).votingCounter());
        for (let i = 0; i < quadCount; i++) {
          try { list.push(await getVotingFrom('quadratic', i)); } catch {}
        }
      } catch {
        const latest = await getReadProvider().getBlockNumber();
        const fromBlock = latest > 100000 ? latest - 100000 : 0;
        let logs: any[] = [];
        try {
          logs = await quad.queryFilter('VotingCreated', fromBlock, latest);
        } catch (e) {}
        const ids = Array.from(new Set(logs.map(l => Number(l.args?.votingId)).filter(n => Number.isFinite(n))));
        if (ids.length > 0) {
          const maxId = Math.max(...ids);
          for (let i = 0; i <= Math.max(maxId, 10); i++) {
            try { list.push(await getVotingFrom('quadratic', i)); } catch {}
          }
        } else {
          for (let i = 0; i < 25; i++) {
            try { list.push(await getVotingFrom('quadratic', i)); } catch {}
          }
        }
      }
    } catch {}

    return list;
  } catch (error) {
    console.error('Failed to get all votings:', error);
    throw error;
  }
}

// Check if user has voted
export async function hasUserVoted(votingId: number, userAddress: string): Promise<boolean> {
  try {
    await ensureInitialized();
    const contract = getContract();
    // Use dedicated view if available, else derive from voterInfo
    try {
      const voted = await contract.hasVoted(votingId, userAddress);
      return Boolean(voted);
    } catch {
      const info = await contract.getVoterInfo(votingId, userAddress);
      return Boolean(info?.hasVoted);
    }
  } catch (error) {
    console.error('Failed to check vote status:', error);
    return false;
  }
}

export async function hasUserVotedFrom(source: 'ballot' | 'quadratic', votingId: number, userAddress: string): Promise<boolean> {
  try {
    await ensureInitialized();
    const c = source === 'quadratic' ? getQuadraticContract() : getContract();
    try {
      const voted = await c.hasVoted(votingId, userAddress);
      return Boolean(voted);
    } catch {
      const info = await c.getVoterInfo(votingId, userAddress);
      return Boolean(info?.hasVoted);
    }
  } catch (error) {
    return false;
  }
}

// Get decrypted results (only available after voting ends and decryption)
export async function getResults(votingId: number): Promise<number[]> {
  try {
    await ensureInitialized();
    try {
      const results = await getContract().getDecryptedResults(votingId);
      if (results && results.length > 0) return results.map((r: any) => Number(r));
    } catch {}
    const results = await getQuadraticContract().getDecryptedResults(votingId);
    
    if (!results || results.length === 0) {
      throw new Error('Results not yet available');
    }
    
    return results.map((r: any) => Number(r));
  } catch (error) {
    console.error('Failed to get results:', error);
    throw error;
  }
}

// Request decryption (owner only)
export async function requestDecryption(votingId: number): Promise<void> {
  try {
    await ensureInitialized();
    let tx;
    try {
      const c = getContract();
      const overrides = await buildTxOverrides(c, 'requestDecryption', [votingId]);
      tx = await c.requestDecryption(votingId, overrides);
    } catch {
      const cq = getQuadraticContract();
      const overrides = await buildTxOverrides(cq, 'requestDecryption', [votingId]);
      tx = await cq.requestDecryption(votingId, overrides);
    }
    await tx.wait();
    
    console.log('Decryption requested');
  } catch (error) {
    console.error('Failed to request decryption:', error);
    throw error;
  }
}

// Get on-chain voting status (0 NotStarted, 1 Active, 2 Ended, 3 Tallied)
export async function getStatus(votingId: number): Promise<number> {
  try {
    await ensureInitialized();
    return Number(await getContract().getVotingStatus(votingId));
  } catch {
    return Number(await getQuadraticContract().getVotingStatus(votingId));
  }
}

export async function getStatusFrom(source: 'ballot' | 'quadratic', votingId: number): Promise<number> {
  // Use read-only provider to avoid wallet/RPC constraints for listing/status
  const c = source === 'quadratic' ? getReadQuadratic() : getReadBallot();
  return Number(await c.getVotingStatus(votingId));
}

// Whether results are available (Tallied)
export async function isResultsAvailable(votingId: number): Promise<boolean> {
  try {
    const status = await getStatus(votingId);
    return status === 3; // Tallied
  } catch {
    return false;
  }
}

export async function getResultsFrom(source: 'ballot' | 'quadratic', votingId: number): Promise<number[]> {
  await ensureInitialized();
  const c = source === 'quadratic' ? getQuadraticContract() : getContract();
  const results = await c.getDecryptedResults(votingId);
  if (!results || results.length === 0) throw new Error('Results not yet available');
  return results.map((r: any) => Number(r));
}

export async function requestDecryptionFrom(source: 'ballot' | 'quadratic', votingId: number): Promise<void> {
  await ensureInitialized();
  const c = source === 'quadratic' ? getQuadraticContract() : getContract();
  const overrides = await buildTxOverrides(c, 'requestDecryption', [votingId]);
  const tx = await c.requestDecryption(votingId, overrides);
  await tx.wait();
}

export async function startVotingFrom(source: 'ballot' | 'quadratic', votingId: number): Promise<void> {
  await ensureInitialized();
  const c = source === 'quadratic' ? getQuadraticContract() : getContract();
  const overrides = await buildTxOverrides(c, 'startVoting', [votingId]);
  const tx = await c.startVoting(votingId, overrides);
  await tx.wait();
}

export async function endVotingFrom(source: 'ballot' | 'quadratic', votingId: number): Promise<void> {
  await ensureInitialized();
  const c = source === 'quadratic' ? getQuadraticContract() : getContract();
  const overrides = await buildTxOverrides(c, 'endVoting', [votingId]);
  const tx = await c.endVoting(votingId, overrides);
  await tx.wait();
}

// Cast a quadratic vote (voteType == 3)
export async function castQuadraticVote(
  votingId: number,
  encryptedVotes: string[],
  credits: number[],
  proof?: string
): Promise<void> {
  try {
    const votesBytes = encryptedVotes.map((h) => ethers.getBytes(h));
    const proofBytes = proof
      ? (proof.startsWith('0x') ? ethers.getBytes(proof) : ethers.toUtf8Bytes(proof))
      : '0x';
    const tx = await getQuadraticContract().castQuadraticVote(
      votingId,
      votesBytes,
      credits,
      proofBytes
    );
    await tx.wait();
  } catch (error) {
    console.error('Failed to cast quadratic vote:', error);
    throw error;
  }
}
