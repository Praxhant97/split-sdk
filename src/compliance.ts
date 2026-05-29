import type { Invoice, Recipient } from "./types.js";

/** A single compliance rule. */
export interface ComplianceRule {
  name: string;
  check(invoice: Invoice): boolean;
  message: string;
}

/** Result of running compliance checks against an invoice. */
export interface ComplianceReport {
  passed: boolean;
  violations: string[];
}

/** Built-in rules used by default. */
export function defaultRules(): ComplianceRule[] {
  return [
    {
      name: "shares_sum_to_100",
      message: "Recipients' shares must sum to 100",
      check(invoice: Invoice): boolean {
        const total = invoice.recipients.reduce((acc, r) => acc + BigInt(r.amount), 0n);
        return total === 100n;
      },
    },
    {
      name: "deadline_min_24h",
      message: "Deadline must be at least 24 hours from now",
      check(invoice: Invoice): boolean {
        const nowSec = Math.floor(Date.now() / 1000);
        return invoice.deadline > nowSec + 24 * 3600;
      },
    },
    {
      name: "amount_positive",
      message: "Total amount must be greater than zero",
      check(invoice: Invoice): boolean {
        const total = invoice.recipients.reduce((acc, r) => acc + BigInt(r.amount), 0n);
        return total > 0n;
      },
    },
  ];
}

/** Evaluate an invoice against the provided rules (or built-ins). */
export function evaluateInvoice(invoice: Invoice, rules?: ComplianceRule[]): ComplianceReport {
  const useRules = rules ?? defaultRules();
  const violations: string[] = [];
  for (const rule of useRules) {
    try {
      if (!rule.check(invoice)) {
        violations.push(rule.message);
      }
    } catch (err) {
      violations.push(`rule ${rule.name} error`);
    }
  }
  return { passed: violations.length === 0, violations };
}
