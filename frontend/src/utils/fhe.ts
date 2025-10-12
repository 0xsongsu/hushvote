// FHE utilities using ZAMA SDK from CDN (compatible with Sepolia)
// Based on working implementation from Zamabelief project

import { ethers, getAddress, hexlify } from 'ethers';

let fheInstance: any = null;

// Initialize FHE instance using CDN-loaded SDK with SepoliaConfig
export async function initializeFHE(): Promise<any> {
  if (fheInstance) return fheInstance;

  // Check if ethereum is available
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found. Please install MetaMask or connect a wallet.');
  }

  try {
    // Load SDK from CDN (0.2.0 - stable version)
    console.log('Loading ZAMA SDK from CDN...');
    const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');

    const { initSDK, createInstance, SepoliaConfig } = sdk as any;

    // Initialize WASM
    await initSDK();

    // Create instance with SepoliaConfig and MetaMask provider
    const config = { ...SepoliaConfig, network: window.ethereum };
    fheInstance = await createInstance(config);

    console.log('✅ FHE instance initialized successfully');
    return fheInstance;
  } catch (err) {
    console.error('❌ FHE initialization failed:', err);
    throw new Error(`FHE initialization failed: ${err}`);
  }
}

// Get existing FHE instance
export function getFheInstance() {
  return fheInstance;
}

// Encrypt a single vote option (32-bit integer)
export async function encryptVote(
  optionIndex: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  let fhe = getFheInstance();
  if (!fhe) {
    fhe = await initializeFHE();
  }
  if (!fhe) throw new Error('Failed to initialize FHE instance');

  const contractAddressChecksum = getAddress(contractAddress) as `0x${string}`;

  // Create encrypted input
  const ciphertext = await fhe.createEncryptedInput(contractAddressChecksum, userAddress);
  ciphertext.add32(optionIndex); // Add 32-bit integer

  // Encrypt and get handles + proof
  const { handles, inputProof } = await ciphertext.encrypt();

  const handle = hexlify(handles[0]);
  const proof = hexlify(inputProof);

  return { handle, proof };
}

// Encrypt a vote with weight (for weighted voting)
export async function encryptWeightedVote(
  optionIndex: number,
  weight: number,
  contractAddress: string,
  userAddress: string
): Promise<{ choice: { handle: string; proof: string }; weight: number }> {
  const choice = await encryptVote(optionIndex, contractAddress, userAddress);
  return { choice, weight };
}

// Encrypt multiple options (for quadratic voting)
export async function encryptMultipleOptions(
  contractAddress: string,
  userAddress: string,
  options: number[]
): Promise<{ handles: string[]; proof: string }> {
  let fhe = getFheInstance();
  if (!fhe) {
    fhe = await initializeFHE();
  }
  if (!fhe) throw new Error('Failed to initialize FHE instance');

  const contractAddressChecksum = getAddress(contractAddress) as `0x${string}`;

  // Create encrypted input with multiple values
  const ciphertext = await fhe.createEncryptedInput(contractAddressChecksum, userAddress);
  for (const option of options) {
    ciphertext.add32(option);
  }

  const { handles, inputProof } = await ciphertext.encrypt();

  const handlesHex = handles.map((h: Uint8Array) => hexlify(h));
  const proofHex = hexlify(inputProof as Uint8Array);

  return { handles: handlesHex, proof: proofHex };
}

// Decrypt a value using the relayer (for results display)
export async function decryptValue(encryptedBytes: string): Promise<number> {
  const fhe = getFheInstance();
  if (!fhe) throw new Error('FHE instance not initialized. Call initializeFHE() first.');

  try {
    let handle = encryptedBytes;
    if (typeof handle === "string" && handle.startsWith("0x") && handle.length === 66) {
      const values = await fhe.publicDecrypt([handle]);
      // values is an object: { [handle]: value }
      return Number(values[handle]);
    } else {
      throw new Error('Invalid ciphertext handle for decryption');
    }
  } catch (error: any) {
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      throw new Error('Decryption service is temporarily unavailable. Please try again later.');
    }
    throw error;
  }
}

// Legacy compatibility functions
export async function encryptVoteUsingRelayer(
  contractAddress: string,
  userAddress: string,
  optionIndex: number
): Promise<{ handle: string; proof: string }> {
  return encryptVote(optionIndex, contractAddress, userAddress);
}

export async function reencryptVote(encryptedVote: string): Promise<string> {
  return encryptedVote;
}

export function generateProof(_encryptedVote: string, _voter: string): string {
  return '0x';
}
