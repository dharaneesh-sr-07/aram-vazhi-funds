import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Field } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMsg } from "@/lib/format";

const settingsQ = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "அமைப்புகள் — அறம் வழிக் குழு" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQ),
  component: SettingsPage,
});

function SettingsPage() {
  const { data } = useSuspenseQuery(settingsQ);
  const qc = useQueryClient();
  const [m, setM] = useState(String(data.monthly_amount));
  const [y, setY] = useState(String(data.yearly_amount));
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.rpc("update_settings", { _monthly: Number(m), _yearly: Number(y) });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("சேமிக்கப்பட்டது (Saved)");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  return (
    <>
      <PageHeader ta="அமைப்புகள்" en="Settings" />
      <Panel title="சந்தா தொகை" sub="Applies to newly generated dues only" className="max-w-lg">
        <form onSubmit={save} className="space-y-4">
          <Field label="மாத சந்தா (Monthly ₹)"><Input type="number" min="1" step="0.01" required value={m} onChange={(e) => setM(e.target.value)} /></Field>
          <Field label="ஆண்டு சந்தா (Yearly ₹)"><Input type="number" min="1" step="0.01" required value={y} onChange={(e) => setY(e.target.value)} /></Field>
          <Button type="submit" disabled={busy}>சேமி (Save)</Button>
        </form>
      </Panel>
    </>
  );
}
