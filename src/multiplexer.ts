import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import { Invoice, Payment, Recipient } from "./types.js";

/**
 * Weighted endpoint configuration for load balancing.
 */
export interface WeightedEndpoint {
  /** RPC endpoint URL */
  url: string;
  /** Weight for this endpoint (higher = more requests) */
  weight: number;
}

/**
 * MultiplexedClient distributes requests across multiple RPC endpoints
 * using weighted round-robin load balancing based on endpoint health scores.
 */
export class MultiplexedClient {
  private endpoints: WeightedEndpoint[];
  private currentWeights: number[];
  private healthScores: number[];
  
  /**
   * Creates a new MultiplexedClient instance.
   * @param endpoints - Array of weighted RPC endpoints
   */
  constructor(endpoints: WeightedEndpoint[]) {
    this.endpoints = endpoints;
    this.currentWeights = endpoints.map(ep => ep.weight);
    this.healthScores = endpoints.map(ep => ep.weight);
  }

  /**
   * Selects an endpoint using weighted round-robin distribution.
   * @returns The selected endpoint
   */
  selectEndpoint(): WeightedEndpoint {
    // Simple weighted round-robin selection
    const totalWeight = this.currentWeights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0 || this.endpoints.length === 0) {
      // If all weights are zero or no endpoints, use first endpoint
      return this.endpoints[0]!;
    }
    
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    for (let i = 0; i < this.endpoints.length; i++) {
      cumulative += this.currentWeights[i] ?? 0;
      if (random <= cumulative) {
        return this.endpoints[i]!;
      }
    }
    
    // Fallback to first endpoint
    return this.endpoints[0]!;
  }

  /**
   * Updates endpoint health score based on success/failure.
   * @param index - Index of the endpoint
   * @param success - Whether the request was successful
   */
  updateHealth(index: number, success: boolean): void {
    if (index < 0 || index >= this.endpoints.length) return;
    
    if (success) {
      // Restore weight on success
      this.healthScores[index] = Math.min(100, (this.healthScores[index] ?? 50) + 10);
      this.currentWeights[index] = this.healthScores[index];
    } else {
      // Reduce weight on failure
      this.healthScores[index] = Math.max(10, (this.healthScores[index] ?? 50) - 20);
      this.currentWeights[index] = this.healthScores[index];
    }
  }

  /**
   * Gets the current health score for an endpoint.
   * @param index - Index of the endpoint
   * @returns Health score (0-100)
   */
  getHealthScore(index: number): number {
    return this.healthScores[index] ?? 50;
  }
}
