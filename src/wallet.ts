/**
 * Freighter wallet adapter for StellarSplit.
 *
 * Wraps @stellar/freighter-api with typed helpers.
 */

import {
  isConnected,
  getPublicKey as freighterGetPublicKey,
  signTransaction as freighterSignTransaction,
  requestAccess,
} from "@stellar/freighter-api";

/** Connect to the Freighter wallet extension and request access. */
export async function connectWallet(): Promise<string> {
  const connected = await isConnected();
  if (!connected) {
    throw new Error(
      "Freighter wallet is not installed. Please install it from https://freighter.app"
    );
  }
  await requestAccess();
  return freighterGetPublicKey();
}

/** Return the connected wallet's public key (G... address). */
export async function getPublicKey(): Promise<string> {
  const connected = await isConnected();
  if (!connected) {
    throw new Error("Freighter wallet is not connected.");
  }
  return freighterGetPublicKey();
}

/**
 * Sign a Stellar transaction XDR string using Freighter.
 *
 * @param xdr     - Base64-encoded transaction XDR.
 * @param network - Network passphrase (e.g. "Test SDF Network ; September 2015").
 * @returns Signed transaction XDR.
 */
export async function signTransaction(
  xdr: string,
  network: string
): Promise<string> {
  const result = await freighterSignTransaction(xdr, { networkPassphrase: network });
  if (typeof result === "string") return result;
  // Newer versions return { signedTxXdr }
  return (result as { signedTxXdr: string }).signedTxXdr;
}
