import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, DataTable, Th } from "@/components/ui-kit";

const auditQ = queryOptions({
  queryKey: ["audit"],
  queryFn: async () => {
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "செயல் பதிவு — அறம் வழிக் குழு" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(auditQ),
  component: AuditPage,
});

function AuditPage() {
  const { data } = useSuspenseQuery(auditQ);
  return (
    <>
      <PageHeader ta="செயல் பதிவு" en="Audit log · last 300 actions" />
      <Panel>
        <DataTable empty={data.length === 0} head={[<Th ta="நேரம்" en="Time" />, <Th ta="யார்" en="By" />, <Th ta="செயல்" en="Action" />, <Th ta="பதிவு" en="Record" />, <Th ta="விவரம்" en="Details" />]}>
          {data.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap">{new Date(a.created_at).toLocaleString("en-IN")}</td>
              <td>{a.actor_name ?? "—"}</td>
              <td className="font-mono text-xs">{a.action}</td>
              <td className="font-mono text-xs">{a.entity_id ?? a.entity}</td>
              <td className="max-w-xs truncate font-mono text-xs text-muted-foreground">{JSON.stringify(a.details)}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
