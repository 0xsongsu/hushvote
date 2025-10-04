import { createInstance as createRelayerInstance } from '@zama-fhe/relayer-sdk/web';
import { BrowserProvider, ethers } from 'ethers';

// Relayer/Verifier/ACL/KMS 配置（Sepolia 默认地址，可通过环境变量覆盖）
export const RELAYER_CONFIG = {
  // Host 链（Sepolia）合约
  ACL_CONTRACT_ADDRESS: import.meta.env.VITE_FHE_ACL_ADDRESS || '0x687820221192C5B662b25367F70076A37bc79b6c',
  KMS_VERIFIER_CONTRACT_ADDRESS: import.meta.env.VITE_FHE_KMS_ADDRESS || '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  INPUT_VERIFIER_CONTRACT_ADDRESS: import.meta.env.VITE_FHE_INPUT_VERIFIER_ADDRESS || '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  // Gateway 链校验合约
  VERIFY_DECRYPTION_ADDRESS: import.meta.env.VITE_FHE_VERIFY_DECRYPTION || '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
  VERIFY_INPUT_ADDRESS: import.meta.env.VITE_FHE_VERIFY_INPUT || '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
  // 链 ID 与 RPC/Relayer
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
    // Host 链配置（Sepolia）
    aclContractAddress: RELAYER_CONFIG.ACL_CONTRACT_ADDRESS,
    kmsContractAddress: RELAYER_CONFIG.KMS_VERIFIER_CONTRACT_ADDRESS,
    inputVerifierContractAddress: RELAYER_CONFIG.INPUT_VERIFIER_ADDRESS,
    chainId: RELAYER_CONFIG.CHAIN_ID,
    // Gateway 链配置
    verifyingContractAddressDecryption: RELAYER_CONFIG.VERIFY_DECRYPTION_ADDRESS,
    verifyingContractAddressInputVerification: RELAYER_CONFIG.VERIFY_INPUT_ADDRESS,
    gatewayChainId: RELAYER_CONFIG.GATEWAY_CHAIN_ID,
    // 网络与 Relayer
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

// 兼容旧接口：不再做本地“重加密”，直接回传原文
export async function reencryptVote(encryptedVote: string): Promise<string> {
  return encryptedVote;
}

// 兼容旧接口：真实 proof 由 relayer 的 encrypt() 返回；此函数保留但不再使用
export function generateProof(_encryptedVote: string, _voter: string): string {
  return '0x';
}
