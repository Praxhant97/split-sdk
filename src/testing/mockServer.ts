import type { Invoice, Payment, Recipient } from '../types.js';

/**
 * MockRPCServer simulates the Stellar RPC protocol in-process for testing.
 * Implements the same interface as SorobanRpc.Server.
 */
export class MockRPCServer {
  private invoices: Map<string, Invoice> = new Map();
  private transactions: Map<string, any> = new Map();

  /**
   * Creates a new MockRPCServer instance.
   */
  constructor() {}

  /**
   * Simulates a transaction against the contract.
   * For invoice creation, stores the invoice in memory.
   */
  async simulateTransaction(
    transaction: any
  ): Promise<any> {
    // Parse the transaction to determine the operation
    const operation = this._extractOperation(transaction);
    
    if (operation?.function === 'create_invoice') {
      // Extract parameters from the operation
      const creator = this._extractAddress(operation?.args[0]);
      const recipients = this._extractRecipients(operation?.args[1]);
      const amounts = this._extractAmounts(operation?.args[2]);
      const token = this._extractAddress(operation?.args[3]);
      const deadline = this._extractNumber(operation?.args[4]);
      
      // Create a mock invoice
      const invoiceId = (this.invoices.size + 1).toString();
      const invoice: Invoice = {
        id: invoiceId,
        creator,
        recipients,
        token,
        deadline,
        funded: 0n,
        status: 'Pending',
        payments: [],
        recurring: false,
      };
      
      this.invoices.set(invoiceId, invoice);
      
      // Return success response with invoice ID
      return {
        result: {
          retval: { type: 'u64', value: invoiceId },
        },
        minResourceFee: '100',
      };
    }
    
    // For other operations, return basic success
    return {
      result: {
        retval: { type: 'void' },
      },
      minResourceFee: '100',
    };
  }

  /**
   * Gets a transaction by hash.
   */
  async getTransaction(
    hash: string
  ): Promise<any> {
    const tx = this.transactions.get(hash);
    if (tx) {
      return tx;
    }
    
    // Return not found for unknown transactions
    return {
      status: 'NOT_FOUND',
      latestLedger: 1,
      latestLedgerCloseTime: 0,
      oldestLedger: 1,
      oldestLedgerCloseTime: 0,
    };
  }

  /**
   * Gets ledger entries.
   */
  async getLedgerEntries(
    keys: any[],
    options?: any
  ): Promise<any> {
    return {
      entries: [],
      latestLedger: 1,
      latestLedgerCloseTime: 0,
      oldestLedger: 1,
      oldestLedgerCloseTime: 0,
    };
  }

  /**
   * Sends a transaction.
   */
  async sendTransaction(
    transaction: any
  ): Promise<any> {
    // Generate a mock transaction hash
    const txHash = `mock_tx_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store the transaction
    const txResponse: any = {
      status: 'SUCCESS',
      hash: txHash,
      ledger: 1,
      createdAt: Date.now(),
      envelopeXdr: '',
      resultXdr: '',
      resultMetaXdr: '',
      latestLedger: 1,
      latestLedgerCloseTime: 0,
      oldestLedger: 1,
      oldestLedgerCloseTime: 0,
      returnValue: { type: 'void' },
    };
    
    this.transactions.set(txHash, txResponse);
    
    return {
      status: 'PENDING',
      hash: txHash,
      latestLedger: 1,
      latestLedgerCloseTime: 0,
      oldestLedger: 1,
      oldestLedgerCloseTime: 0,
    };
  }

  /**
   * Gets an account.
   */
  async getAccount(
    accountId: string
  ): Promise<any> {
    return {
      accountId: () => accountId,
      sequenceNumber: () => '1',
      incrementSequenceNumber: () => {},
      sign: () => {},
      signDecorated: () => {},
      xdr: () => '',
      publicKey: accountId,
      secretKey: '',
      keypair: null,
    };
  }

  /**
   * Helper to extract operation from transaction.
   */
  private _extractOperation(transaction: any): { function: string; args: any[] } | null {
    try {
      // This is a simplified extraction - in real implementation would parse the XDR
      if (transaction?.operations && transaction.operations.length > 0) {
        const op = transaction.operations[0];
        if (op?.contractCall) {
          return {
            function: op.contractCall.function,
            args: op.contractCall.args || [],
          };
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Helper to extract address from SCVal.
   */
  private _extractAddress(scVal: any): string {
    if (!scVal) return 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    if (scVal.type === 'address') {
      return scVal.value?.accountId || 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    }
    return 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  }

  /**
   * Helper to extract recipients from SCVal array.
   */
  private _extractRecipients(scVal: any): Recipient[] {
    if (!scVal || scVal.type !== 'vec') return [];
    
    const recipients: Recipient[] = [];
    for (let i = 0; i < scVal.value?.length; i++) {
      const addr = this._extractAddress(scVal.value[i]);
      recipients.push({
        address: addr,
        amount: 100000000n, // default amount
      });
    }
    return recipients;
  }

  /**
   * Helper to extract amounts from SCVal array.
   */
  private _extractAmounts(scVal: any): bigint[] {
    if (!scVal || scVal.type !== 'vec') return [];
    
    const amounts: bigint[] = [];
    for (let i = 0; i < scVal.value?.length; i++) {
      const val = scVal.value[i]?.value;
      amounts.push(BigInt(val || '0'));
    }
    return amounts;
  }

  /**
   * Helper to extract number from SCVal.
   */
  private _extractNumber(scVal: any): number {
    if (!scVal) return Date.now() + 86400;
    if (scVal.type === 'u64') {
      return Number(scVal.value || '0');
    }
    return Date.now() + 86400;
  }
}
