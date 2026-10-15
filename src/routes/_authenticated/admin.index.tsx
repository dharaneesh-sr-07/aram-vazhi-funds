import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Users, Wallet, HandCoins, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard, Panel, DataTable, Th, StatusPill } from "@/components/ui-kit";
import { inr, fmtDate, MT_STATUS } from "@/lib/format";

const dashQ = queryOptions({
  queryKey: ["admin-dash"],
  queryFn: async () => {
    const [m, ob, mt] = await Promise.all([
      supabase.from("members").select("id,status"),
      supabase.from("obligation_status").select("amount_due,amount_paid,remaining"),
      supabase.from("money_taken_status").select("*").order("taken_date", { ascending: false }),
    ]);
    const sum = (a: { [k: string]: unknown }[] | null, k: string) => (a ?? []).reduce((s, r) => s + Number(r[k] ?? 0), 0);
    return {
      active: (m.data ?? []).filter((x) => x.status === "active").length,
      total: m.data?.length ?? 0,
      collected: sum(ob.data, "amount_paid"),
      pendingSubs: sum(ob.data, "remaining"),
      outstanding: sum(mt.data, "remaining"),
      recent: (mt.data ?? []).slice(0, 8),
    };
  },
});

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "நிர்வாகி முகப்பு — அறம் வழிக் குழு" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashQ),
  component: AdminHome,
});

function AdminHome() {
  const { me } = Route.useRouteContext();
  const { data } = useSuspenseQuery(dashQ);
  return (
    <>
      <PageHeader ta="நிர்வாகி முகப்பு" en={`Admin Dashboard · ${me.fullName}`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} ta="செயலில் உறுப்பினர்கள்" en={`Active members (of ${data.total})`} value={data.active} />
        <StatCard icon={Wallet} ta="வசூலான சந்தா" en="Subscriptions collected" value={inr(data.collected)} />
        <StatCard icon={AlertCircle} ta="நிலுவை சந்தா" en="Pending subscriptions" value={inr(data.pendingSubs)} tone="danger" />
        <StatCard icon={HandCoins} ta="திருப்ப வேண்டியது" en="Outstanding to return" value={inr(data.outstanding)} tone="gold" />
      </div>
      <Panel title="சமீபத்திய கடன்கள்" sub="Recent money taken">
        <DataTable empty={data.recent.length === 0} head={[<Th ta="குறியீடு" en="Code" />, <Th ta="உறுப்பினர்" en="Member" />, <Th ta="தேதி" en="Date" />, <Th ta="மொத்தம்" en="Total" />, <Th ta="மீதம்" en="Remaining" />, <Th ta="நிலை" en="Status" />]}>
          {data.recent.map((r) => {
            const s = MT_STATUS[r.status ?? "active"];
            return (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.transaction_code}</td>
                <td>{r.full_name}</td>
                <td>{fmtDate(r.taken_date)}</td>
                <td className="tabular-nums">{inr(r.total_to_return)}</td>
                <td className="tabular-nums">{inr(r.remaining)}</td>
                <td><StatusPill tone={s?.tone ?? "muted"}>{s?.ta} ({s?.en})</StatusPill></td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
    </>
  );
}
