export class Deduplicator<T> {
  private _inflight = new Map<string, Promise<T>>();

  dedupe(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this._inflight.get(key);
    if (existing) return existing;

    const promise = fn().finally(() => this._inflight.delete(key));
    this._inflight.set(key, promise);
    return promise;
  }
}
