import { describe, it, expect } from "vitest";
import { evaluateInvoice } from "../src/compliance.js";
import type { Invoice } from "../src/types.js";

describe("compliance", () => {
  it("detects shares sum violation", () => {
    const invoice: Invoice = {
      id: "1",
      creator: "GCREATOR",
      recipients: [
        { address: "G1", amount: 30n },
        { address: "G2", amount: 40n },
      ],
      token: "TOKEN",
      deadline: Math.floor(Date.now() / 1000) + 48 * 3600,
      funded: 0n,
      status: "Pending",
      payments: [],
    };

    const report = evaluateInvoice(invoice);
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.includes("sum to 100"))).toBe(true);
  });
});
