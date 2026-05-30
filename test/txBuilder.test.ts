import { describe, it, expect, vi, beforeEach } from "vitest";
import { StellarSplitTxBuilder } from "../src/txBuilder.js";
import { rpc as SorobanRpc, xdr } from "@stellar/stellar-sdk";

const TEST_CONFIG = {
  rpcUrl: "http://localhost:8000",
  networkPassphrase: "Test",
  contractId: "CONTRACT",
} as const;

describe("StellarSplitTxBuilder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("chains operations and submits a single transaction", async () => {
    // stub server methods
    const getAccount = vi.fn().mockResolvedValue({ accountId: () => "GAAA", sequenceNumber: () => "1", incrementSequenceNumber: () => {} });
    const simulateTransaction = vi.fn().mockResolvedValue({ result: { retval: xdr.ScVal.scvVoid() }, minResourceFee: "0" });
    const sendTransaction = vi.fn().mockResolvedValue({ status: "SUCCESS", hash: "abc123" });
    const getTransaction = vi.fn().mockResolvedValue({ status: SorobanRpc.Api.GetTransactionStatus.SUCCESS, returnValue: xdr.ScVal.scvVoid() });

    // Patch the Server prototype to use our stubs
    // @ts-expect-error - augmenting prototype for tests
    SorobanRpc.Server.prototype.getAccount = getAccount;
    // @ts-expect-error
    SorobanRpc.Server.prototype.simulateTransaction = simulateTransaction;
    // @ts-expect-error
    SorobanRpc.Server.prototype.sendTransaction = sendTransaction;
    // @ts-expect-error
    SorobanRpc.Server.prototype.getTransaction = getTransaction;

    // Ensure assembleTransaction/isSimulationError behave
    vi.spyOn(SorobanRpc, "assembleTransaction").mockImplementation(() => ({ build: () => ({ toXDR: () => "XDR" }) } as any));
    vi.spyOn(SorobanRpc.Api, "isSimulationError").mockImplementation(() => false as any);

    const builder = new StellarSplitTxBuilder(TEST_CONFIG as any, "GAAA");
    builder.addPay("1", 100n).addRelease("1");

    const tx = builder.build();
    expect(typeof tx.toXDR).toBe("function");

    const result = await builder.submit();
    expect(result.txHash).toBe("abc123");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });
});
