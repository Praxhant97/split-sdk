import { describe, it, expect, vi } from "vitest";
import { ExportPipeline } from "../src/exportPipeline.js";
import type { Invoice } from "../src/types.js";

describe("ExportPipeline", () => {
  const mockInvoices: Invoice[] = [
    {
      id: "1",
      creator: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
      recipients: [
        { address: "GDEF456...", amount: 1000n },
      ],
      token: "USDC_CONTRACT",
      deadline: 1234567890,
      funded: 500n,
      status: "Pending",
      payments: [
        { payer: "GPAYER1...", amount: 500n },
      ],
      recurring: false,
    },
    {
      id: "2",
      creator: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
      recipients: [
        { address: "GDEF456...", amount: 2000n },
      ],
      token: "USDC_CONTRACT",
      deadline: 1234567890,
      funded: 0n,
      status: "Pending",
      payments: [],
      recurring: false,
    },
  ];

  it("runs pipeline with filter + format and returns string output", async () => {
    const pipeline = new ExportPipeline()
      .filter((invoices) =>
        invoices.filter((inv) => inv.funded > 0n),
      )
      .format((invoices) =>
        invoices.map((inv) => `${inv.id}:${inv.funded}`).join("\n"),
      );

    const output = await pipeline.run(mockInvoices);
    expect(output).toBe("1:500");
  });

  it("filter, transform, format, and to are chainable", async () => {
    const sink = vi.fn();

    const pipeline = new ExportPipeline()
      .filter((invoices) => invoices.filter((inv) => inv.funded > 0n))
      .transform((invoices) =>
        invoices.map((inv) => ({
          id: inv.id,
          memo: `filtered-${inv.id}`,
        })),
      )
      .format((invoices) =>
        invoices.map((inv) => `${inv.id}:${(inv as { memo: string }).memo}`).join(","),
      )
      .to(sink);

    expect(pipeline).toBeInstanceOf(ExportPipeline);

    const output = await pipeline.run(mockInvoices);
    expect(output).toBe("1:filtered-1");
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith(output);
  });

  it("executes all stages in order", async () => {
    const order: string[] = [];

    const pipeline = new ExportPipeline()
      .filter(async (invoices) => {
        order.push("filter");
        return invoices;
      })
      .transform(async (invoices) => {
        order.push("transform");
        return invoices;
      })
      .format(async (invoices) => {
        order.push("format");
        return `${invoices.length}`;
      });

    await pipeline.run(mockInvoices);
    expect(order).toEqual(["filter", "transform", "format"]);
  });

  it("supports multiple sinks via multiple to() calls", async () => {
    const sink1 = vi.fn();
    const sink2 = vi.fn();
    const sink3 = vi.fn();

    const pipeline = new ExportPipeline()
      .format((invoices) => invoices.map((i) => i.id).join(","))
      .to(sink1)
      .to(sink2)
      .to(sink3);

    const output = await pipeline.run(mockInvoices);
    expect(output).toBe("1,2");
    expect(sink1).toHaveBeenCalledWith("1,2");
    expect(sink2).toHaveBeenCalledWith("1,2");
    expect(sink3).toHaveBeenCalledWith("1,2");
  });

  it("uses default JSON formatter when no format is registered", async () => {
    const pipeline = new ExportPipeline();
    const output = await pipeline.run(mockInvoices);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]!.id).toBe("1");
    expect(parsed[1]!.id).toBe("2");
  });

  it("handles empty invoice array", async () => {
    const sink = vi.fn();
    const pipeline = new ExportPipeline()
      .format(() => "no-invoices")
      .to(sink);

    const output = await pipeline.run([]);
    expect(output).toBe("no-invoices");
    expect(sink).toHaveBeenCalledWith("no-invoices");
  });

  it("supports async filter stages", async () => {
    const pipeline = new ExportPipeline()
      .filter(async (invoices) => {
        // Simulate async filtering
        await Promise.resolve();
        return invoices.filter((inv) => inv.id === "1");
      })
      .format((invoices) => invoices.map((i) => i.id).join(","));

    const output = await pipeline.run(mockInvoices);
    expect(output).toBe("1");
  });

  it("supports async sink stages", async () => {
    const asyncSink = vi.fn().mockResolvedValue(undefined);

    const pipeline = new ExportPipeline()
      .format(() => "async-sink-test")
      .to(asyncSink);

    const output = await pipeline.run(mockInvoices);
    expect(output).toBe("async-sink-test");
    expect(asyncSink).toHaveBeenCalledWith("async-sink-test");
  });
});
