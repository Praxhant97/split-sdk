import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import { Invoice, Payment, Recipient } from "./types.js";

/**
 * Configuration for the request batcher.
 */
export interface BatcherConfig {
  /** Time window in milliseconds to collect requests before batching */
  windowMs: number;
  /** Maximum number of requests to include in a single batch */
  maxBatchSize: number;
}

/**
 * RequestBatcher collects read requests within a configurable time window
 * and submits them as a single batch RPC call.
 */
export class RequestBatcher {
  private pendingRequests: Array<{
    invoiceId: string;
    resolve: (invoice: Invoice) => void;
    reject: (error: Error) => void;
  }> = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private config: BatcherConfig;
  
  /**
   * Creates a new RequestBatcher instance.
   * @param config - Batcher configuration
   */
  constructor(config: BatcherConfig = { windowMs: 10, maxBatchSize: 100 }) {
    this.config = config;
  }

  /**
   * Queues a getInvoice request for batching.
   * @param invoiceId - The invoice ID to fetch
   * @returns A promise that resolves with the invoice
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    return new Promise<Invoice>((resolve, reject) => {
      this.pendingRequests.push({ invoiceId, resolve, reject });
      
      // Start the batching timer if not already running
      if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => this._processBatch(), this.config.windowMs);
      }
      
      // If we've reached max batch size, process immediately
      if (this.pendingRequests.length >= this.config.maxBatchSize) {
        this._processBatch();
      }
    });
  }

  /**
   * Processes the pending requests as a batch.
   * In a real implementation, this would make a single RPC call to get multiple invoices.
   */
  private async _processBatch(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.pendingRequests.length === 0) return;
    
    // In a real implementation, this would:
    // 1. Make a single RPC call to get all pending invoice IDs
    // 2. Distribute results to the appropriate promises
    // 3. Handle errors appropriately
    
    // For now, we'll simulate by resolving each request individually
    // This is just a placeholder for the real implementation
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];
    
    // Simulate fetching invoices (in real implementation, this would be one RPC call)
    for (const req of requests) {
      try {
        // Simulate fetching the invoice
        const invoice: Invoice = {
          id: req.invoiceId,
          creator: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
          recipients: [{ address: "GBPMKIE33DB77R5ITZKU6J76L6M5H6Z6G7YXZQYVWU7XZQYVWU7XZQYVWU7XZQYV", amount: 100000000n }],
          token: "CA3D5KRYM6CB7OWQ6TWYRR3Z4T75RBSVHYQ5M53RFBI7YE3QN7ZD5WL8",
          deadline: Date.now() + 86400,
          funded: 0n,
          status: "Pending",
          payments: [],
          recurring: false,
        };
        req.resolve(invoice);
      } catch (error) {
        req.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Gets the current number of pending requests.
   * @returns Number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.length;
  }

  /**
   * Clears all pending requests.
   */
  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    this.pendingRequests.forEach(req => {
      req.reject(new Error("Request batcher cleared"));
    });
    this.pendingRequests = [];
  }
}
