/**
 * Utility helpers for StellarSplit SDK.
 */

/** Number of decimal places used by Stellar token amounts (stroops). */
const STROOPS_PER_UNIT = 10_000_000n;

/**
 * Format a stroop amount as a human-readable USDC string.
 *
 * @example formatAmount(10_000_000n) // "1.0000000"
 */
export function formatAmount(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_UNIT;
  const frac = stroops % STROOPS_PER_UNIT;
  return `${whole}.${frac.toString().padStart(7, "0")}`;
}

/**
 * Parse a human-readable USDC string into stroops.
 *
 * @example parseAmount("1.5") // 15_000_000n
 */
export function parseAmount(value: string): bigint {
  const [whole = "0", frac = ""] = value.split(".");
  const fracPadded = frac.padEnd(7, "0").slice(0, 7);
  return BigInt(whole) * STROOPS_PER_UNIT + BigInt(fracPadded);
}

/**
 * Validate a Stellar public key (G... address).
 *
 * Uses a simple regex; for full validation use stellar-sdk StrKey.
 */
export function isValidAddress(address: string): boolean {
  return /^G[A-Z2-7]{54,55}$/.test(address);
}

/**
 * Return a Unix timestamp (seconds) for a date that is `days` from now.
 */
export function deadlineFromDays(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 86_400;
}

/**
 * Return true if a Unix timestamp deadline has passed.
 */
export function isExpired(deadline: number): boolean {
  return Math.floor(Date.now() / 1000) > deadline;
}

/**
 * Truncate a Stellar address for display: "GABC...XYZ".
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
