import { ethers } from 'ethers'
import ballotAbiJson from '../src/abi/FHEBallot.json' assert { type: 'json' }

// Update these if needed
const RPC = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/1d4b7fd7fa354aeca092b2420b0cf09f'
const BALLOT = process.env.BALLOT_ADDR || '0x9b1a9c59adb3CCF2572CC0861bEd113AF38a89CE'
const QUAD = process.env.QUAD_ADDR || '0x5e0d42eebcd382476f47A8d59521E2D5fb21A423'

async function main(){
  const provider = new ethers.JsonRpcProvider(RPC)
  console.log('RPC network:', (await provider.getNetwork()).name)
  const ballot = new ethers.Contract(BALLOT, ballotAbiJson.abi, provider)
  const quad = new ethers.Contract(QUAD, ballotAbiJson.abi, provider)

  // Try direct counter
  try {
    const c = await ballot.votingCounter()
    console.log('Ballot.votingCounter =', c.toString())
  } catch(e){
    console.log('Ballot.votingCounter not available:', e.message)
  }
  try {
    const c = await quad.votingCounter()
    console.log('Quadratic.votingCounter =', c.toString())
  } catch(e){
    console.log('Quadratic.votingCounter not available:', e.message)
  }

  // Scan events (last 500k blocks)
  const latest = await provider.getBlockNumber()
  const fromBlock = latest > 500000 ? latest - 500000 : 0
  console.log('Scanning logs from', fromBlock, 'to', latest)
  const logs = await ballot.queryFilter('VotingCreated', fromBlock, latest)
  console.log('Ballot VotingCreated logs:', logs.length)
  const ids = logs.map(l => Number(l.args?.votingId)).filter(n => Number.isFinite(n))
  console.log('Ballot votingIds from logs:', ids)

  // Fetch details for a few ids
  for (const id of ids.slice(0, 5)){
    try {
      const cfg = await ballot.getVotingConfig(id)
      const opts = await ballot.getVotingOptions(id)
      console.log(`Ballot id=${id} name=${cfg.name} start=${cfg.startTime} end=${cfg.endTime} options=${opts.length}`)
    } catch(e){
      console.log('Ballot getVoting failed id=', id, e.message)
    }
  }
}

main().catch((e)=>{ console.error(e); process.exit(1) })
