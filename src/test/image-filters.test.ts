import { describe, expect, it } from "vitest";
import { matchesImageFilters, subscriptionPeriodDate, type ImageFilters } from "@/lib/image-filters";

const base: ImageFilters = { memberId: "all", startDate: "", endDate: "", minAmount: "", maxAmount: "", amountField: "amount" };
const records = [
  { memberId: "dharaneesh", date: "2025-01-01", amount: 100 },
  { memberId: "sarath", date: "2025-12-31", amount: 300 },
  { memberId: "ashwin", date: "2026-01-01", amount: 500 },
];
const select = (filters: Partial<ImageFilters>) => records.filter((r) => matchesImageFilters(r, { ...base, ...filters }));
describe("image download filters", () => {
  it("includes all members when All Members is selected", () => expect(select({})).toHaveLength(3));
  it("includes only the selected name", () => expect(select({ memberId: "sarath" })).toEqual([records[1]]));
  it("includes date boundaries and excludes other dates", () => expect(select({ startDate: "2025-01-01", endDate: "2025-12-31" })).toEqual(records.slice(0, 2)));
  it("includes amount boundaries and excludes other amounts", () => expect(select({ minAmount: "100", maxAmount: "300" })).toEqual(records.slice(0, 2)));
  it("applies name, date and amount together", () => expect(select({ memberId: "sarath", startDate: "2026-01-01", minAmount: "300" })).toEqual([]));
  it("supports a single amount bound including zero", () => expect(select({ maxAmount: "0" })).toEqual([]));
  it("excludes undated records when a date bound is set", () => expect(matchesImageFilters({ memberId: "sarath", date: null, amount: 100 }, { ...base, startDate: "2025-01-01" })).toBe(false));
  it("maps subscription month and year to a period date", () => {
    expect(subscriptionPeriodDate(2025, 12)).toBe("2025-12-01");
    expect(subscriptionPeriodDate(2025, null)).toBe("2025-01-01");
  });
});