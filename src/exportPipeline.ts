/**
 * Invoice export pipeline for StellarSplit SDK.
 *
 * Provides a chainable ExportPipeline that transforms a stream of invoices
 * through configurable stages (filter, transform, format) and outputs to
 * multiple targets (file, HTTP endpoint, console).
 */

import type { Invoice } from "./types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A pipeline stage receives an invoice and may return a transformed value
 * (sync or async).
 */
export type PipelineStage<T> = (input: T) => T | Promise<T>;

/**
 * A sink consumes the final formatted output string.
 */
export type PipelineSink = (output: string) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Default stages
// ---------------------------------------------------------------------------

/** Default formatter that outputs JSON. */
function defaultFormatter(invoices: Invoice[]): string {
  return JSON.stringify(invoices, (_key, value) => {
    if (typeof value === "bigint") return value.toString();
    return value;
  }, 2);
}

// ---------------------------------------------------------------------------
// ExportPipeline class
// ---------------------------------------------------------------------------

export class ExportPipeline {
  private filters: Array<PipelineStage<Invoice[]>> = [];
  private transforms: Array<PipelineStage<Invoice[]>> = [];
  private formatters: Array<PipelineStage<Invoice[]>> = [];
  private sinks: PipelineSink[] = [];

  /**
   * Add a filter stage. The filter receives all invoices and returns a
   * (possibly filtered) subset.
   */
  filter(fn: PipelineStage<Invoice[]>): this {
    this.filters.push(fn);
    return this;
  }

  /**
   * Add a transform stage. The transform receives all invoices and returns
   * modified invoice data.
   */
  transform(fn: PipelineStage<Invoice[]>): this {
    this.transforms.push(fn);
    return this;
  }

  /**
   * Add a format stage. The format receives all invoices and must return a
   * string representation. If no formatter is registered, JSON output is used.
   */
  format(fn: PipelineStage<Invoice[]>): this {
    this.formatters.push(fn);
    return this;
  }

  /**
   * Register an output sink. Multiple sinks are supported; call `.to()`
   * multiple times to add each one.
   */
  to(sink: PipelineSink): this {
    this.sinks.push(sink);
    return this;
  }

  /**
   * Execute the pipeline against the provided invoices.
   *
   * Stages are run in order:
   *   1. All filter stages (in registration order)
   *   2. All transform stages (in registration order)
   *   3. All format stages (in registration order); if none registered,
   *      the default JSON formatter is used.
   *   4. All sink stages (in registration order)
   *
   * @param invoices - The invoices to process.
   * @returns The final formatted string.
   */
  async run(invoices: Invoice[]): Promise<string> {
    let data: Invoice[] = [...invoices];

    // 1. Apply filters
    for (const fn of this.filters) {
      data = await fn(data);
    }

    // 2. Apply transforms
    for (const fn of this.transforms) {
      data = await fn(data);
    }

    // 3. Apply formatters (or use default)
    let output: string;
    if (this.formatters.length === 0) {
      output = defaultFormatter(data);
    } else {
      let formatted: unknown = data;
      for (const fn of this.formatters) {
        formatted = await fn(formatted as Invoice[]);
      }
      output = formatted as string;
    }

    // 4. Send to all sinks
    for (const sink of this.sinks) {
      await sink(output);
    }

    return output;
  }
}
