import { Invoice, Payment } from "./types.js";

/**
 * Merkle proof structure for invoice payment verification.
 */
export interface MerkleProof {
  /** The leaf hash being proven (payment hash) */
  leaf: string;
  /** Sibling hashes along the path to the root */
  path: string[];
  /** The Merkle root hash */
  root: string;
}

/**
 * Generate a Merkle proof for a specific payment within an invoice.
 * @param invoiceId - The invoice ID
 * @param paymentIndex - The index of the payment in the invoice's payments array
 * @returns A Merkle proof object
 */
export async function generateMerkleProof(
  invoiceId: string,
  paymentIndex: number
): Promise<MerkleProof> {
  // In a real implementation, this would:
  // 1. Fetch the invoice from the contract
  // 2. Extract all payment hashes
  // 3. Build a Merkle tree from the payment hashes
  // 4. Generate the proof for the specified payment index
  
  // For now, we'll return a mock proof
  const leaf = `payment-${invoiceId}-${paymentIndex}-hash`;
  const path = [
    `sibling-${invoiceId}-${paymentIndex}-1`,
    `sibling-${invoiceId}-${paymentIndex}-2`
  ];
  const root = `root-${invoiceId}-${paymentIndex}`;
  
  return {
    leaf,
    path,
    root
  };
}

/**
 * Verify a Merkle proof against a given root hash.
 * @param proof - The Merkle proof to verify
 * @returns true if the proof is valid, false otherwise
 */
export function verifyMerkleProof(proof: MerkleProof): boolean {
  // In a real implementation, this would:
  // 1. Recompute the root hash from the leaf and path
  // 2. Compare the computed root with the provided root
  
  // For now, we'll do a simple validation
  if (!proof.leaf || !proof.root || !Array.isArray(proof.path)) {
    return false;
  }
  
  // Simple validation - in real implementation would compute the actual hash
  return proof.leaf.length > 0 && proof.root.length > 0 && proof.path.length >= 0;
}
