import { describe, expect, it } from "vitest";
import { calculateFinanceSummary, calculateMonthlyMemberDues, type FinanceMember, type FinanceObligation } from "@/lib/finance-summary";

const member: FinanceMember = {
  id: "m1",
  member_code: "AVK001",
  full_name: "Dharaneesh S",
  status: "active",
  joined_on: "2025-04-15",
  created_at: "2025-04-15T00:00:00Z",
};

const summaryInput = {
  year: 2025,
  members: [member],
  obligations: [
    { id: "monthly-apr", member_id: "m1", payment_type: "monthly" as const, period_year: 2025, period_month: 4, amount_due: 100, amount_paid: 100 },
    { id: "yearly", member_id: "m1", payment_type: "yearly" as const, period_year: 2025, period_month: null, amount_due: 300, amount_paid: 300 },
  ],
  receipts: [
    { obligation_id: "monthly-apr", amount_paid: 100, payment_date: "2025-04-20" },
    { obligation_id: "yearly", amount_paid: 300, payment_date: "2025-04-20" },
  ],
  moneyTaken: [{ id: "take1", member_id: "m1", taken_date: "2025-05-01", amount_taken: 10_000 }],
  moneyReturned: [{ money_taken_id: "take1", payment_date: "2025-06-01", principal_returned: 10_000, interest_amount: 1_000 }],
  expenses: [{ expense_date: "2025-07-01", amount: 250 }],
  now: new Date("2026-01-01T00:00:00Z"),
};

describe("three-account financial calculations", () => {
  it("keeps original returned money in the saree fund and interest in Extra", () => {
    const result = calculateFinanceSummary(summaryInput);
    expect(result.sareeCollected).toBe(300);
    expect(result.sareeAvailable).toBe(300);
    expect(result.sareeGiven).toBe(10_000);
    expect(result.sareeReturned).toBe(10_000);
    expect(result.sareePending).toBe(0);
    expect(result.extraCollected).toBe(1_000);
    expect(result.extraSpent).toBe(250);
    expect(result.extraBalance).toBe(750);
  });

  it("calculates monthly unpaid months and pending amount from joining month", () => {
    const rows: FinanceObligation[] = [
      { id: "paid-apr", member_id: "m1", payment_type: "monthly", period_year: 2025, period_month: 4, amount_due: 100, amount_paid: 100 },
      { id: "partial-may", member_id: "m1", payment_type: "monthly", period_year: 2025, period_month: 5, amount_due: 100, amount_paid: 40 },
    ];
    const [due] = calculateMonthlyMemberDues(2025, [member], rows, new Date("2026-01-01T00:00:00Z"));
    expect(due?.monthsDue).toBe(9);
    expect(due?.unpaidMonths).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    expect(due?.pendingAmount).toBe(760);
  });

  it("does not count future months as pending in the current year", () => {
    const [due] = calculateMonthlyMemberDues(2026, [{ ...member, joined_on: "2026-01-01" }], [], new Date("2026-03-15T00:00:00Z"));
    expect(due?.monthsDue).toBe(3);
    expect(due?.unpaidMonths).toEqual([1, 2, 3]);
    expect(due?.pendingAmount).toBe(300);
  });
});