import { describe, expect, it } from "vitest";
import { calculateFundBalance } from "@/lib/fund-balance";

describe("fund total", () => {
  it("deducts money given out from the total", () => {
    expect(calculateFundBalance(1000, [{ amount_taken: 300, extra_amount: 0, amount_returned: 0 }]).total).toBe(700);
  });

  it("adds money received back, including partial returns", () => {
    expect(calculateFundBalance(1000, [{ amount_taken: 300, extra_amount: 0, amount_returned: 100 }]).total).toBe(800);
  });

  it("keeps extra credited once while adding the actual returned amount", () => {
    expect(calculateFundBalance(1000, [{ amount_taken: 300, extra_amount: 50, amount_returned: 350 }])).toEqual({ extra: 50, taken: 300, returned: 350, total: 1100 });
  });

  it("keeps a negative balance visible rather than masking it", () => {
    expect(calculateFundBalance(100, [{ amount_taken: 300, extra_amount: 0, amount_returned: 0 }]).total).toBe(-200);
  });
});