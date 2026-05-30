import { describe, it, expect, vi } from "vitest";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { StellarSplitClient } from "../src/client.js";
import { WalletConnectAdapter } from "../src/adapters/walletconnect.js";

// Mock the WalletConnect client
const mockWalletConnectClient = {
  request: vi.fn(),
};

const mockTopic = "mock-topic-123";
const mockChainId = "stellar:testnet";
const mockAddress = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

describe("StellarSplitClient with WalletConnect adapter", () => {
  it("uses WalletConnect adapter for signing when provided", async () => {
    mockWalletConnectClient.request.mockResolvedValue("signed-xdr");
    
    const client = new StellarSplitClient({
      rpcUrl: "https://example.com",
      networkPassphrase: "Test Network",
      contractId: StrKey.encodeContract(Keypair.random().rawPublicKey()),
      adapter: new WalletConnectAdapter({
        client: mockWalletConnectClient,
        topic: mockTopic,
        chainId: mockChainId,
        address: mockAddress,
      }),
    });
    
    // Mock the _submitTx method to avoid actual RPC calls
    const submitSpy = vi.spyOn(client as any, "_submitTx").mockResolvedValue({
      txHash: "tx-hash",
      returnValue: {},
    });
    
    // Call a method that triggers signing
    await client.pay({
      payer: mockAddress,
      invoiceId: "123",
      amount: 10_000_000n,
    });
    
    // Verify that WalletConnect was used instead of Freighter
    expect(mockWalletConnectClient.request).toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalled();
  });
});
