/**
 * Utility helpers for StellarSplit SDK.
 */
import { Invoice } from "./types";

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

/**
 * Validates if a caller is in the invoice's allowed callers list.
 */
export function validateCallerAllowlist(
  invoice: Invoice,
  callerAddress: string
): { allowed: boolean; reason?: string } {
  if (!invoice.allowed_callers) {
    return { allowed: true };
  }
  if (invoice.allowed_callers.includes(callerAddress)) {
    return { allowed: true };
  }
  return { allowed: false, reason: "caller not in allowlist" };
}

/**
 * Computes the penalty amount owed for a late payment.
 */
export function calculatePenalty(
  invoice: Invoice,
  paymentTimestamp: number
): { penaltyBps: number; penaltyAmount: bigint; tier: number | null } {
  if (!invoice.penalty_deadline || paymentTimestamp <= invoice.penalty_deadline) {
    return { penaltyBps: 0, penaltyAmount: 0n, tier: null };
  }
  
  if (!invoice.penalty_tiers || invoice.penalty_tiers.length === 0) {
    return { penaltyBps: 0, penaltyAmount: 0n, tier: null };
  }

  const daysLate = Math.ceil((paymentTimestamp - invoice.penalty_deadline) / 86400);
  
  // Sort tiers by days_late descending to find the highest applicable tier
  const sortedTiers = [...invoice.penalty_tiers].sort((a, b) => b.days_late - a.days_late);
  const applicableTier = sortedTiers.find(tier => daysLate >= tier.days_late);

  if (!applicableTier) {
    return { penaltyBps: 0, penaltyAmount: 0n, tier: null };
  }

  const totalAmount = invoice.recipients.reduce((sum, r) => sum + r.amount, 0n);
  const penaltyAmount = (totalAmount * BigInt(applicableTier.penalty_bps)) / 10000n;

  return {
    penaltyBps: applicableTier.penalty_bps,
    penaltyAmount,
    tier: invoice.penalty_tiers.indexOf(applicableTier)
  };
}
