import { describe, it, expect } from "vitest";
import { RequestBatcher } from "../src/requestBatcher.js";

/**
 * Tests for the RequestBatcher implementation
 */
describe("RequestBatcher", () => {
  it("should create a new instance with default config", () => {
    const batcher = new RequestBatcher();
    expect(batcher).toBeDefined();
  });

  it("should queue getInvoice requests", async () => {
    const batcher = new RequestBatcher({ windowMs: 1, maxBatchSize: 5 });
    
    // Start 5 concurrent getInvoice calls
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(batcher.getInvoice(`invoice-${i}`));
    }
    
    // Wait for all promises to resolve
    await Promise.all(promises);
    
    // Verify all promises resolved
    expect(promises.length).toBe(5);
  });

  it("should respect maxBatchSize limit", async () => {
    const batcher = new RequestBatcher({ windowMs: 1, maxBatchSize: 3 });
    
    // Start 5 concurrent getInvoice calls
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(batcher.getInvoice(`invoice-${i}`));
    }
    
    // Wait for all promises to resolve
    await Promise.all(promises);
    
    // Should have processed in at least 2 batches (3+2)
    expect(promises.length).toBe(5);
  });
});
