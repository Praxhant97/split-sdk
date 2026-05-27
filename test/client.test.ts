import { describe, it, expect } from "vitest";
import {
  formatAmount,
  parseAmount,
  isValidAddress,
  deadlineFromDays,
  isExpired,
  truncateAddress,
} from "../src/utils.js";
import { calculateVesting } from "../src/vesting.js";
import type { Invoice } from "../src/types.js";

describe("formatAmount", () => {
  it("formats whole units", () => {
    expect(formatAmount(10_000_000n)).toBe("1.0000000");
  });

  it("formats fractional units", () => {
    expect(formatAmount(15_000_000n)).toBe("1.5000000");
  });

  it("formats zero", () => {
    expect(formatAmount(0n)).toBe("0.0000000");
  });

  it("formats large amounts", () => {
    expect(formatAmount(1_000_000_000n)).toBe("100.0000000");
  });
});

describe("parseAmount", () => {
  it("parses whole units", () => {
    expect(parseAmount("1")).toBe(10_000_000n);
  });

  it("parses fractional units", () => {
    expect(parseAmount("1.5")).toBe(15_000_000n);
  });

  it("parses zero", () => {
    expect(parseAmount("0")).toBe(0n);
  });

  it("round-trips with formatAmount", () => {
    const stroops = 123_456_789n;
    expect(parseAmount(formatAmount(stroops))).toBe(stroops);
  });
});

describe("isValidAddress", () => {
  it("accepts valid G address", () => {
    expect(
      isValidAddress("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN")
    ).toBe(true);
  });

  it("rejects short address", () => {
    expect(isValidAddress("GABC")).toBe(false);
  });

  it("rejects non-G prefix", () => {
    expect(
      isValidAddress("SAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN")
    ).toBe(false);
  });
});

describe("deadlineFromDays", () => {
  it("returns a future timestamp", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(deadlineFromDays(7)).toBeGreaterThan(now);
  });

  it("is approximately 7 days ahead", () => {
    const now = Math.floor(Date.now() / 1000);
    const deadline = deadlineFromDays(7);
    expect(deadline - now).toBeCloseTo(7 * 86_400, -2);
  });
});

describe("isExpired", () => {
  it("returns true for past timestamp", () => {
    expect(isExpired(1_000_000)).toBe(true);
  });

  it("returns false for future timestamp", () => {
    expect(isExpired(Math.floor(Date.now() / 1000) + 10_000)).toBe(false);
  });
});

describe("truncateAddress", () => {
  it("truncates long address", () => {
    const addr = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
    expect(truncateAddress(addr)).toBe("GAAZ...CCWN");
  });

  it("respects custom chars param", () => {
    const addr = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
    const result = truncateAddress(addr, 6);
    expect(result).toBe("GAAZI4...KOCCWN");
  });
});

describe("calculateVesting", () => {
  const mockInvoice: Invoice & { vestingCliff?: number; dripDuration?: number } = {
    id: "1",
    creator: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    recipients: [
      {
        address: "GBRPYHIL2CI3WHZDTOOQFC6EB4NCCCBFUJZMUWEALWDSDW7Y2M5XWDP",
        amount: 100_000_000n,
      },
    ],
    token: "CBBD47AB7C010CB047B57A1C1FB990F309A8F323F8C0EB20E5FF0DCD5891986D",
    deadline: 1700000000,
    funded: 0n,
    status: "Pending",
    payments: [],
    vestingCliff: 1700000000,
    dripDuration: 86400, // 1 day
  };

  it("returns 0 before cliff", () => {
    const schedule = calculateVesting(mockInvoice);
    expect(schedule.claimableAt(1699999999)).toBe(0n);
  });

  it("returns full amount after vesting", () => {
    const schedule = calculateVesting(mockInvoice);
    expect(schedule.claimableAt(1700086400)).toBe(100_000_000n);
  });

  it("returns partial amount during vesting", () => {
    const schedule = calculateVesting(mockInvoice);
    const halfwayTime = 1700000000 + 43200; // 12 hours
    const claimable = schedule.claimableAt(halfwayTime);
    expect(claimable).toBe(50_000_000n);
  });

  it("has correct cliff and vested dates", () => {
    const schedule = calculateVesting(mockInvoice);
    expect(schedule.cliffDate).toBe(1700000000);
    expect(schedule.fullyVestedDate).toBe(1700086400);
  });
});
