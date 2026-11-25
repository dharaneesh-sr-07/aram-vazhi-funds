import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, HandCoins, Receipt, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, StatCard, DataTable, Th } from "@/components/ui-kit";
import { inr, fmtDate, monthLabel } from "@/lib/format";
import { selectCls } from "@/lib/nav";
import { asFinanceObligations, calculateFinanceSummary } from "@/lib/finance-summary";

const financeQ = queryOptions({
  queryKey: ["admin-finance"],
  queryFn: async () => {
    const [members, obligations, receipts, moneyTaken, moneyReturned, expenses] = await Promise.all([
      supabase.from("members").select("id,member_code,full_name,status,joined_on,created_at").order("member_code"),
      supabase.from("obligation_status").select("id,member_id,payment_type,period_month,period_year,amount_due,amount_paid"),
      supabase.from("subscription_receipts").select("obligation_id,amount_paid,payment_date"),
      supabase.from("money_taken").select("id,member_id,taken_date,amount_taken,notes").order("taken_date", { ascending: false }),
      supabase.from("money_returned").select("money_taken_id,payment_date,principal_returned,interest_amount"),
      supabase.from("extra_expenses").select("expense_date,amount"),
    ]);
    if (members.error) throw members.error;
    if (obligations.error) throw obligations.error;
    if (receipts.error) throw receipts.error;
    if (moneyTaken.error) throw moneyTaken.error;
    if (moneyReturned.error) throw moneyReturned.error;
    if (expenses.error) throw expenses.error;
    return {
      members: members.data ?? [],
      obligations: asFinanceObligations(obligations.data ?? []),
      receipts: receipts.data ?? [],
      moneyTaken: moneyTaken.data ?? [],
      moneyReturned: moneyReturned.data ?? [],
      expenses: expenses.data ?? [],
    };
  },
});

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "நிர்வாகி முகப்பு — அறம் வழிக் குழு" }, { name: "description", content: "மாத சந்தா, புடவைப் பணம் மற்றும் கூடுதல் வட்டி கணக்குகளின் ஆண்டு வாரியான நிர்வாகச் சுருக்கம்." }, { property: "og:title", content: "நிர்வாகி முகப்பு — அறம் வழிக் குழு" }, { property: "og:description", content: "மாத சந்தா, புடவைப் பணம் மற்றும் கூடுதல் வட்டி கணக்குகளின் ஆண்டு வாரியான நிர்வாகச் சுருக்கம்." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQ),
  component: AdminHome,
});

function AdminHome() {
  const { me } = Route.useRouteContext();
  const { data } = useSuspenseQuery(financeQ);
  const [year, setYear] = useState(new Date().getFullYear());
  const summary = calculateFinanceSummary({ ...data, year });
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set([
    ...Array.from({ length: 6 }, (_, index) => currentYear - index),
    ...data.obligations.map((row) => row.period_year),
  ])).sort((a, b) => b - a);
  const memberNames = new Map(data.members.map((member) => [member.id, member.full_name]));
  const recentTaken = data.moneyTaken.filter((row) => Number(row.taken_date.slice(0, 4)) === year).slice(0, 8);

  return (
    <>
      <PageHeader
        ta="நிர்வாகி முகப்பு"
        en={`Admin Dashboard · ${me.fullName}`}
        actions={
          <label className="flex min-w-48 items-center gap-2 text-sm font-medium">
            <span className="whitespace-nowrap">நிதியாண்டு (Year)</span>
            <select className={selectCls} value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} ta="மொத்த உறுப்பினர்கள்" en="Total members" value={summary.totalMembers} />
        <StatCard icon={Receipt} ta="மாத சந்தா வசூல்" en={`${year} · Monthly subscription collected`} value={inr(summary.monthlyCollected)} />
        <StatCard icon={AlertCircle} ta="மாத சந்தா வேண்டியது" en="Monthly subscription pending" value={inr(summary.monthlyPending)} tone="danger" />
        <StatCard icon={Wallet} ta="புடவைப் பணம் வசூல்" en={`${year} · Saree fund collected`} value={inr(summary.sareeCollected)} />
        <StatCard icon={Wallet} ta="புடவைப் பண இருப்பு" en={`Available Saree Fund · ${year} year-end`} value={inr(summary.sareeAvailable)} />
        <StatCard icon={ArrowDownToLine} ta="புடவைப் பணம் கொடுத்தது" en={`${year} · Saree fund given`} value={inr(summary.sareeGiven)} />
        <StatCard icon={ArrowUpFromLine} ta="அசல் தொகை திரும்பியது" en={`${year} · Original amount returned`} value={inr(summary.sareeReturned)} />
        <StatCard icon={HandCoins} ta="கூடுதல் வட்டி வசூல்" en={`Interest collected · Extra balance ${inr(summary.extraBalance)}`} value={inr(summary.extraCollected)} tone="gold" />
        <StatCard icon={AlertCircle} ta="புடவைப் பணம் நிலுவை" en={`Pending Saree Fund returns · ${year} year-end`} value={inr(summary.sareePending)} tone="danger" />
      </div>

      <Panel title={`${year} மாத சந்தா நிலுவை`} sub="Unpaid months and amount for each member" className="mb-6">
        <DataTable empty={summary.monthlyDues.length === 0} head={[<Th ta="உறுப்பினர்" en="Member" />, <Th ta="செலுத்தாத மாதங்கள்" en="Unpaid months" />, <Th ta="நிலுவை" en="Pending amount" />]}>
          {summary.monthlyDues.map((row) => (
            <tr key={row.memberId}>
              <td><span className="font-medium">{row.memberName}</span> <span className="font-mono text-xs text-muted-foreground">{row.memberCode}</span></td>
              <td>{row.unpaidMonths.length ? row.unpaidMonths.map(monthLabel).join(" · ") : "நிலுவை இல்லை (Clear)"}</td>
              <td className="tabular-nums">{inr(row.pendingAmount)}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="பணம் கொடுத்த பதிவுகள்" sub={`${year} · Saree fund given`}>
        <DataTable empty={recentTaken.length === 0} head={[<Th ta="உறுப்பினர்" en="Member" />, <Th ta="தேதி" en="Date" />, <Th ta="அசல் தொகை" en="Principal given" />, <Th ta="குறிப்பு" en="Description" />]}>
          {recentTaken.map((row) => (
            <tr key={row.id}>
              <td>{memberNames.get(row.member_id) ?? "—"}</td>
              <td>{fmtDate(row.taken_date)}</td>
              <td className="tabular-nums">{inr(row.amount_taken)}</td>
              <td className="text-muted-foreground">{row.notes ?? "—"}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}