import { createInstance as createRelayerInstance } from '@zama-fhe/relayer-sdk/web';
import { BrowserProvider, ethers } from 'ethers';

// Relayer/Verifier/ACL/KMS configuration (Sepolia default addresses, can be overridden via environment variables)
export const RELAYER_CONFIG = {
  // Host chain (Sepolia) contracts
  ACL_CONTRACT_ADDRESS: import.meta.env.VITE_FHE_ACL_ADDRESS || '0x687820221192C5B662b25367F70076A37bc79b6c',
  KMS_VERIFIER_CONTRACT_ADDRESS: import.meta.env.VITE_FHE_KMS_ADDRESS || '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  INPUT_VERIFIER_CONTRACT_ADDRESS: import.meta.env.VITE_FHE_INPUT_VERIFIER_ADDRESS || '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  // Gateway chain verification contracts
  VERIFY_DECRYPTION_ADDRESS: import.meta.env.VITE_FHE_VERIFY_DECRYPTION || '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
  VERIFY_INPUT_ADDRESS: import.meta.env.VITE_FHE_VERIFY_INPUT || '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
  // Chain ID and RPC/Relayer
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID || 11155111),
  GATEWAY_CHAIN_ID: Number(import.meta.env.VITE_FHE_GATEWAY_CHAIN_ID || 55815),
  RPC_URL: import.meta.env.VITE_RPC_URL || 'https://1rpc.io/sepolia',
  RELAYER_URL: import.meta.env.VITE_FHE_RELAYER_URL || 'https://relayer.testnet.zama.cloud',
};

type RelayerInstance = Awaited<ReturnType<typeof createRelayerInstance>> | null;
let relayer: RelayerInstance = null;

const toHex = (bytes: Uint8Array) => '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

export async function initializeFHE(): Promise<RelayerInstance> {
  if (relayer) return relayer;
  const provider = new ethers.JsonRpcProvider(RELAYER_CONFIG.RPC_URL);
  relayer = await createRelayerInstance({
    // Host chain configuration (Sepolia)
    aclContractAddress: RELAYER_CONFIG.ACL_CONTRACT_ADDRESS,
    kmsContractAddress: RELAYER_CONFIG.KMS_VERIFIER_CONTRACT_ADDRESS,
    inputVerifierContractAddress: RELAYER_CONFIG.INPUT_VERIFIER_ADDRESS,
    chainId: RELAYER_CONFIG.CHAIN_ID,
    // Gateway chain configuration
    verifyingContractAddressDecryption: RELAYER_CONFIG.VERIFY_DECRYPTION_ADDRESS,
    verifyingContractAddressInputVerification: RELAYER_CONFIG.VERIFY_INPUT_ADDRESS,
    gatewayChainId: RELAYER_CONFIG.GATEWAY_CHAIN_ID,
    // Network and Relayer
    network: RELAYER_CONFIG.RPC_URL,
    relayerUrl: RELAYER_CONFIG.RELAYER_URL,
  });
  return relayer;
}

export async function encryptVoteUsingRelayer(
  contractAddress: string,
  userAddress: string,
  optionIndex: number
): Promise<{ handle: string; proof: string }> {
  const sdk = await initializeFHE();
  if (!sdk) throw new Error('Relayer SDK init failed');
  const builder = sdk.createEncryptedInput(contractAddress, userAddress);
  builder.add32(optionIndex);
  const { handles, inputProof } = await builder.encrypt();
  const handle = toHex(handles[0]);
  const proof = toHex(inputProof);
  return { handle, proof };
}

export async function encryptVote(
  optionIndex: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  return encryptVoteUsingRelayer(contractAddress, userAddress, optionIndex);
}

export async function encryptWeightedVote(
  optionIndex: number,
  weight: number,
  contractAddress: string,
  userAddress: string
): Promise<{ choice: { handle: string; proof: string }; weight: number }> {
  const choice = await encryptVoteUsingRelayer(contractAddress, userAddress, optionIndex);
  return { choice, weight };
}

export async function encryptMultipleOptions(
  contractAddress: string,
  userAddress: string,
  optionCount: number
): Promise<{ handles: string[]; proof: string }> {
  const sdk = await initializeFHE();
  if (!sdk) throw new Error('Relayer SDK init failed');
  const builder = sdk.createEncryptedInput(contractAddress, userAddress);
  for (let i = 0; i < optionCount; i++) builder.add32(i);
  const { handles, inputProof } = await builder.encrypt();
  const handlesHex = handles.map((h: Uint8Array) => toHex(h));
  const proofHex = toHex(inputProof as Uint8Array);
  return { handles: handlesHex, proof: proofHex };
}

// Legacy interface compatibility: no longer performs local "re-encryption", returns original ciphertext directly
export async function reencryptVote(encryptedVote: string): Promise<string> {
  return encryptedVote;
}

// Legacy interface compatibility: real proof is returned by relayer's encrypt(); this function is kept but no longer used
export function generateProof(_encryptedVote: string, _voter: string): string {
  return '0x';
}
