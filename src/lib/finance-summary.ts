export type FinanceMember = {
  id: string;
  member_code: string;
  full_name: string;
  status: "active" | "inactive";
  joined_on: string | null;
  created_at: string;
};

export type FinanceObligation = {
  id: string;
  member_id: string;
  payment_type: "monthly" | "yearly";
  period_month: number | null;
  period_year: number;
  amount_due: number | null;
  amount_paid: number | null;
};

export type FinanceReceipt = {
  obligation_id: string;
  amount_paid: number;
  payment_date: string;
};

export type FinanceMoneyTaken = {
  id: string;
  member_id: string;
  taken_date: string;
  amount_taken: number;
};

export type FinanceMoneyReturned = {
  money_taken_id: string;
  payment_date: string;
  principal_returned: number;
  interest_amount: number;
};

export type FinanceExpense = {
  expense_date: string;
  amount: number;
};

export type MonthlyMemberDue = {
  memberId: string;
  memberCode: string;
  memberName: string;
  unpaidMonths: number[];
  pendingAmount: number;
  monthsDue: number;
};

export function asFinanceObligations(
  records: {
    id: string | null;
    member_id: string | null;
    payment_type: "monthly" | "yearly" | null;
    period_month: number | null;
    period_year: number | null;
    amount_due: number | null;
    amount_paid: number | null;
  }[],
): FinanceObligation[] {
  return records.flatMap((record) =>
    record.id && record.member_id && record.payment_type && record.period_year !== null
      ? [{
          id: record.id,
          member_id: record.member_id,
          payment_type: record.payment_type,
          period_month: record.period_month,
          period_year: record.period_year,
          amount_due: record.amount_due,
          amount_paid: record.amount_paid,
        }]
      : [],
  );
}

const yearOf = (date: string | null | undefined) => Number(date?.slice(0, 4) ?? 0);
const amount = (value: number | null | undefined) => Number(value ?? 0);

export function calculateMonthlyMemberDues(
  year: number,
  members: FinanceMember[],
  obligations: FinanceObligation[],
  now = new Date(),
): MonthlyMemberDue[] {
  const currentYear = now.getFullYear();
  const cutoffMonth = year < currentYear ? 12 : year === currentYear ? now.getMonth() + 1 : 0;

  return members.map((member) => {
    const joinedOn = member.joined_on ?? member.created_at;
    const joinedYear = yearOf(joinedOn);
    const joinedMonth = joinedYear === year ? Number(joinedOn.slice(5, 7)) : 1;
    const firstMonth = joinedYear < year ? 1 : joinedYear === year ? joinedMonth : 13;
    const monthly = obligations.filter(
      (obligation) => obligation.member_id === member.id && obligation.payment_type === "monthly" && obligation.period_year === year,
    );
    const unpaidMonths: number[] = [];
    let pendingAmount = 0;
    let monthsDue = 0;

    for (let month = firstMonth; month <= cutoffMonth; month += 1) {
      if (month < 1 || month > 12) continue;
      monthsDue += 1;
      const obligation = monthly.find((item) => item.period_month === month);
      const due = amount(obligation?.amount_due ?? 100);
      const paid = amount(obligation?.amount_paid);
      const remaining = Math.max(due - paid, 0);
      if (remaining > 0) {
        unpaidMonths.push(month);
        pendingAmount += remaining;
      }
    }

    return { memberId: member.id, memberCode: member.member_code, memberName: member.full_name, unpaidMonths, pendingAmount, monthsDue };
  });
}

export function calculateFinanceSummary(input: {
  year: number;
  members: FinanceMember[];
  obligations: FinanceObligation[];
  receipts: FinanceReceipt[];
  moneyTaken: FinanceMoneyTaken[];
  moneyReturned: FinanceMoneyReturned[];
  expenses: FinanceExpense[];
  now?: Date;
}) {
  const { year, members, obligations, receipts, moneyTaken, moneyReturned, expenses } = input;
  const obligationById = new Map(obligations.map((obligation) => [obligation.id, obligation]));
  const throughYear = (date: string) => yearOf(date) <= year;
  const inYear = (date: string) => yearOf(date) === year;
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  const isMonthlyReceipt = (receipt: FinanceReceipt) => obligationById.get(receipt.obligation_id)?.payment_type === "monthly";
  const isYearlyReceipt = (receipt: FinanceReceipt) => obligationById.get(receipt.obligation_id)?.payment_type === "yearly";
  const monthlyDues = calculateMonthlyMemberDues(year, members, obligations, input.now);
  const principalReturnedInYear = moneyReturned.filter((item) => inYear(item.payment_date));
  const principalReturnedThroughYear = moneyReturned.filter((item) => throughYear(item.payment_date));
  const yearlyReceiptsInYear = receipts.filter((item) => inYear(item.payment_date) && isYearlyReceipt(item));
  const yearlyReceiptsThroughYear = receipts.filter((item) => throughYear(item.payment_date) && isYearlyReceipt(item));
  const takenInYear = moneyTaken.filter((item) => inYear(item.taken_date));
  const takenThroughYear = moneyTaken.filter((item) => throughYear(item.taken_date));
  const interestInYear = moneyReturned.filter((item) => inYear(item.payment_date));
  const interestThroughYear = moneyReturned.filter((item) => throughYear(item.payment_date));
  const expensesInYear = expenses.filter((item) => inYear(item.expense_date));
  const expensesThroughYear = expenses.filter((item) => throughYear(item.expense_date));

  const monthlyCollected = sum(receipts.filter((item) => inYear(item.payment_date) && isMonthlyReceipt(item)).map((item) => amount(item.amount_paid)));
  const sareeCollected = sum(yearlyReceiptsInYear.map((item) => amount(item.amount_paid)));
  const sareeCollectedThroughYear = sum(yearlyReceiptsThroughYear.map((item) => amount(item.amount_paid)));
  const sareeGiven = sum(takenInYear.map((item) => amount(item.amount_taken)));
  const sareeReturned = sum(principalReturnedInYear.map((item) => amount(item.principal_returned)));
  const sareeAvailable = sareeCollectedThroughYear
    + sum(principalReturnedThroughYear.map((item) => amount(item.principal_returned)))
    - sum(takenThroughYear.map((item) => amount(item.amount_taken)));
  const sareePending = Math.max(
    sum(takenThroughYear.map((item) => amount(item.amount_taken)))
      - sum(principalReturnedThroughYear.map((item) => amount(item.principal_returned))),
    0,
  );
  const extraCollected = sum(interestInYear.map((item) => amount(item.interest_amount)));
  const extraSpent = sum(expensesInYear.map((item) => amount(item.amount)));
  const extraBalance = sum(interestThroughYear.map((item) => amount(item.interest_amount)))
    - sum(expensesThroughYear.map((item) => amount(item.amount)));

  return {
    year,
    totalMembers: members.length,
    monthlyCollected,
    monthlyPending: sum(monthlyDues.map((item) => item.pendingAmount)),
    monthlyDues,
    sareeCollected,
    sareeAvailable,
    sareeGiven,
    sareeReturned,
    sareePending,
    extraCollected,
    extraSpent,
    extraBalance,
  };
}