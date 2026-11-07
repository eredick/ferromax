import { describe, expect, it } from "vitest";

import { buildOrderSummary, MAX_ORDER_QUANTITY } from "./order";

describe("buildOrderSummary", () => {
  it("uses catalog prices instead of any browser-supplied price", () => {
    const browserItem = { id: "p1", qty: 1, price: 0 };
    const summary = buildOrderSummary([browserItem]);

    expect(summary).not.toBeNull();
    expect(summary?.items).toEqual([
      {
        id: "p1",
        name: "Taladro percutor 20V inalámbrico",
        price: 389.9,
        qty: 1,
      },
    ]);
    expect(summary?.subtotal).toBe(389.9);
    expect(summary?.shipping).toBe(0);
    expect(summary?.total).toBe(389.9);
  });

  it("calculates paid shipping below the free-shipping threshold", () => {
    const summary = buildOrderSummary([
      { id: "p4", qty: 1 },
      { id: "p8", qty: 1 },
    ]);

    expect(summary?.subtotal).toBe(54.4);
    expect(summary?.shipping).toBe(15);
    expect(summary?.total).toBe(69.4);
  });

  it("makes shipping free at exactly the threshold", () => {
    const summary = buildOrderSummary([{ id: "p12", qty: 1 }]);

    expect(summary?.subtotal).toBe(199);
    expect(summary?.shipping).toBe(0);
    expect(summary?.total).toBe(199);
  });

  it("rejects unknown products and invalid quantities", () => {
    expect(buildOrderSummary([{ id: "unknown", qty: 1 }])).toBeNull();
    expect(buildOrderSummary([{ id: "p1", qty: 0 }])).toBeNull();
    expect(buildOrderSummary([{ id: "p1", qty: MAX_ORDER_QUANTITY + 1 }])).toBeNull();
    expect(buildOrderSummary([{ id: "p1", qty: 1.5 }])).toBeNull();
  });

  it("accepts the maximum supported quantity", () => {
    const summary = buildOrderSummary([{ id: "p12", qty: MAX_ORDER_QUANTITY }]);

    expect(summary?.items[0]?.qty).toBe(MAX_ORDER_QUANTITY);
    expect(summary?.total).toBe(199 * MAX_ORDER_QUANTITY);
  });

  it("rejects empty and over-sized order item lists", () => {
    expect(buildOrderSummary([])).toBeNull();
    expect(buildOrderSummary(Array.from({ length: 51 }, () => ({ id: "p1", qty: 1 })))).toBeNull();
  });
});
