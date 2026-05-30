import type { Keypair } from "@stellar/stellar-sdk";
import type { RequestInterceptor, RPCRequest } from "./interceptors.js";

function base64(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString("base64");
}

export function createRequestSigningInterceptor(keypair: Keypair): RequestInterceptor {
  return async (req: RPCRequest): Promise<RPCRequest> => {
    const timestamp = Date.now();
    const message = `stellar-split:${timestamp}`;
    // Keypair.sign accepts Uint8Array / Buffer
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sig = keypair.sign(Buffer.from(message));
    const header = `Bearer ${keypair.publicKey()}:${timestamp}:${base64(sig as Buffer)}`;

    // Attach an `__auth` property to params so tests/interceptors can inspect it.
    // The RPC transport in this SDK does not surface HTTP headers via interceptors,
    // so we put the header into the request params for downstream consumers/tests.
    const params = Array.isArray(req.params) ? [...req.params] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params as any).__auth = header;

    return { method: req.method, params };
  };
}
