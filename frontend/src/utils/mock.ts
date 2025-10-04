import { CONTRACT_ADDRESSES, SUPPORTED_CHAINS } from '../config/contracts'
import { saveCache, loadCache } from './storage'

type VotingData = {
  id: number
  title: string
  description: string
  options: string[]
  startTime: number // seconds
  endTime: number // seconds
  creator: string
  votingType: number
  numOptions: number
  totalVotes: number
  isActive: boolean
  source?: 'mock'
}

function makeVote(i: number, now: number, kind: 'pending' | 'active' | 'ended'): VotingData {
  const sec = (mins: number) => mins * 60
  let start = now + sec(5)
  let end = now + sec(65)
  if (kind === 'active') { start = now - sec(5); end = now + sec(55) }
  if (kind === 'ended') { start = now - sec(120); end = now - sec(60) }
  const options = [`Option A${i}`, `Option B${i}`, ...(i % 3 === 0 ? [`Option C${i}`] : [])]
  return {
    id: 10_000 + i, // use a high id unlikely to clash with on-chain ids
    title: `Mock Voting #${i}`,
    description: `This is a locally cached mock voting ${i}.`,
    options,
    startTime: Math.floor(start),
    endTime: Math.floor(end),
    creator: '0x0000000000000000000000000000000000000000',
    votingType: i % 4, // 0..3
    numOptions: options.length,
    totalVotes: 0,
    isActive: kind === 'active',
    source: 'mock',
  }
}

export async function seedMockVotes(count = 15) {
  const cacheKey = `hv:votings:${CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEBallot}:${CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEQuadraticVoting}`
  const cached = loadCache<VotingData[]>(cacheKey)
  const now = Math.floor(Date.now() / 1000)
  const mocks: VotingData[] = []
  for (let i = 1; i <= count; i++) {
    const kind = i % 3 === 1 ? 'active' : i % 3 === 2 ? 'pending' : 'ended'
    mocks.push(makeVote(i, now, kind))
  }
  const base = cached?.data || []
  // Keep existing ones that are not mock
  const nonMock = base.filter((v: any) => v?.source !== 'mock')
  const next = [...mocks, ...nonMock]
  saveCache(cacheKey, next)
  // Expose to window for quick manual call
  if (typeof window !== 'undefined') {
    ;(window as any).__HV_MOCK_CACHE__ = next
  }
  return next
}

// If developer wants a quick function on window:
if (typeof window !== 'undefined') {
  ;(window as any).hvSeedVotes = seedMockVotes
}

