import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { LayoutDashboard, Wallet, AlertCircle, HandCoins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatCard, Panel, DataTable, Th, StatusPill } from "@/components/ui-kit";
import { inr, fmtDate, monthLabel, SUB_STATUS, MT_STATUS } from "@/lib/format";

const myQ = queryOptions({
  queryKey: ["my-records"],
  queryFn: async () => {
    const [ob, mt, mr] = await Promise.all([
      supabase.from("obligation_status").select("*").order("period_year", { ascending: false }).order("period_month", { ascending: false, nullsFirst: false }),
      supabase.from("money_taken_status").select("*").order("taken_date", { ascending: false }),
      supabase.from("money_returned").select("*").order("payment_date", { ascending: false }),
    ]);
    return { ob: ob.data ?? [], mt: mt.data ?? [], mr: mr.data ?? [] };
  },
});

export const Route = createFileRoute("/_authenticated/member")({
  head: () => ({ meta: [{ title: "உறுப்பினர் முகப்பு — அறம் வழிக் குழு" }] }),
  beforeLoad: ({ context }) => {
    if (context.me.mustChange) throw redirect({ to: "/change-password" });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(myQ),
  component: MemberHome,
});

function MemberHome() {
  const { me } = Route.useRouteContext();
  const { data } = useSuspenseQuery(myQ);
  const ob = data.ob.filter((o) => o.member_id === me.memberId);
  const mt = data.mt.filter((o) => o.member_id === me.memberId);
  const mr = data.mr.filter((o) => o.member_id === me.memberId);
  const sum = (a: { [k: string]: unknown }[], k: string) => a.reduce((s, r) => s + Number(r[k] ?? 0), 0);
  const codeOf = new Map(mt.map((t) => [t.id, t.transaction_code]));
  return (
    <AppShell me={me} title="உறுப்பினர் (Member)" nav={[{ to: "/member", ta: "முகப்பு", en: "Home", icon: LayoutDashboard, exact: true }]}>
      <PageHeader ta={`வணக்கம், ${me.fullName}`} en={`Member Dashboard · ${me.memberCode}`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} ta="செலுத்திய சந்தா" en="Subscriptions paid" value={inr(sum(ob, "amount_paid"))} />
        <StatCard icon={AlertCircle} ta="நிலுவை சந்தா" en="Pending subscriptions" value={inr(sum(ob, "remaining"))} tone="danger" />
        <StatCard icon={HandCoins} ta="திருப்ப வேண்டியது" en="Amount to return" value={inr(sum(mt, "remaining"))} tone="gold" />
      </div>
      <Panel title="என் சந்தா" sub="My subscriptions" className="mb-6">
        <DataTable empty={ob.length === 0} head={[<Th ta="வகை" en="Type" />, <Th ta="காலம்" en="Period" />, <Th ta="தொகை" en="Due" />, <Th ta="செலுத்தியது" en="Paid" />, <Th ta="மீதம்" en="Remaining" />, <Th ta="நிலை" en="Status" />]}>
          {ob.map((r) => {
            const s = SUB_STATUS[r.status ?? "pending"] ?? SUB_STATUS[Object.keys(SUB_STATUS)[0]!]!;
            return (
              <tr key={r.id}>
                <td>{r.payment_type === "monthly" ? "மாதம் (Monthly)" : "ஆண்டு (Yearly)"}</td>
                <td>{r.payment_type === "monthly" ? monthLabel(r.period_month) + " " : ""}{r.period_year}</td>
                <td className="tabular-nums">{inr(r.amount_due)}</td>
                <td className="tabular-nums">{inr(r.amount_paid)}</td>
                <td className="tabular-nums">{inr(r.remaining)}</td>
                <td><StatusPill tone={s.tone}>{s.ta} ({s.en})</StatusPill></td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
      <Panel title="நான் பெற்ற பணம்" sub="Money I have taken" className="mb-6">
        <DataTable empty={mt.length === 0} head={[<Th ta="குறியீடு" en="Code" />, <Th ta="தேதி" en="Date" />, <Th ta="தொகை" en="Taken" />, <Th ta="கூடுதல்" en="Extra" />, <Th ta="மொத்தம்" en="Total" />, <Th ta="மீதம்" en="Remaining" />, <Th ta="நிலை" en="Status" />]}>
          {mt.map((t) => {
            const s = MT_STATUS[t.status ?? "active"] ?? MT_STATUS[Object.keys(MT_STATUS)[0]!]!;
            return (
              <tr key={t.id}>
                <td className="font-mono text-xs">{t.transaction_code}</td>
                <td>{fmtDate(t.taken_date)}</td>
                <td className="tabular-nums">{inr(t.amount_taken)}</td>
                <td className="tabular-nums">{inr(t.extra_amount)}</td>
                <td className="tabular-nums">{inr(t.total_to_return)}</td>
                <td className="tabular-nums">{inr(t.remaining)}</td>
                <td><StatusPill tone={s.tone}>{s.ta} ({s.en})</StatusPill></td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
      <Panel title="நான் திருப்பியவை" sub="My repayments">
        <DataTable empty={mr.length === 0} head={[<Th ta="குறியீடு" en="Code" />, <Th ta="பெற்ற தொகை குறியீடு" en="Money taken ID" />, <Th ta="தேதி" en="Date" />, <Th ta="தொகை" en="Amount" />]}>
          {mr.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs">{r.return_code}</td>
              <td className="font-mono text-xs">{codeOf.get(r.money_taken_id)}</td>
              <td>{fmtDate(r.payment_date)}</td>
              <td className="tabular-nums">{inr(r.amount_returned)}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AppShell>
  );
}
