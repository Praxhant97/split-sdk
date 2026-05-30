import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { integrationTestHarness } from "../src/testing/index.js";

/**
 * Integration test using the IntegrationTestHarness
 */
describe("IntegrationTestHarness", () => {
  beforeAll(async () => {
    // Set up the test harness before all tests
    await integrationTestHarness.setup();
  });

  afterAll(async () => {
    // Clean up after all tests
    await integrationTestHarness.teardown();
  });

  it("should create a test invoice ID", () => {
    const invoiceId = integrationTestHarness.createTestInvoice();
    expect(invoiceId).toContain("test-invoice-");
  });

  it("should fund a test wallet", async () => {
    const testAddress = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ";
    await expect(
      integrationTestHarness.fundTestWallet(testAddress, 100000000n)
    ).resolves.not.toThrow();
  });
});
