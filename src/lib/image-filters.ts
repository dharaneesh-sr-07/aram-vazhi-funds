export type ImageFilters = {
  memberId: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  amountField: string;
};

export function matchesImageFilters(
  record: { memberId: string | null | undefined; date: string | null | undefined; amount: number | string | null | undefined },
  filters: ImageFilters,
) {
  if (filters.memberId !== "all" && record.memberId !== filters.memberId) return false;
  const date = record.date?.slice(0, 10);
  if ((filters.startDate || filters.endDate) && !date) return false;
  if (filters.startDate && date && date < filters.startDate) return false;
  if (filters.endDate && date && date > filters.endDate) return false;
  const amount = Number(record.amount ?? 0);
  if (filters.minAmount !== "" && amount < Number(filters.minAmount)) return false;
  if (filters.maxAmount !== "" && amount > Number(filters.maxAmount)) return false;
  return true;
}

export function subscriptionPeriodDate(year: number | null, month: number | null) {
  return year ? `${year}-${String(month ?? 1).padStart(2, "0")}-01` : null;
}