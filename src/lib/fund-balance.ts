type MoneyRecord = {
  amount_taken: number | null;
  extra_amount: number | null;
  amount_returned: number | null;
};

export function calculateFundBalance(collected: number, records: MoneyRecord[]) {
  const extra = records.reduce((sum, row) => sum + Number(row.extra_amount ?? 0), 0);
  const taken = records.reduce((sum, row) => sum + Number(row.amount_taken ?? 0), 0);
  const returned = records.reduce((sum, row) => sum + Number(row.amount_returned ?? 0), 0);
  return { extra, taken, returned, total: collected + extra - taken + returned };
}