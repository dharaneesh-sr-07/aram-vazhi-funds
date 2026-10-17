import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, DataTable, Th, Field } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inr, errMsg } from "@/lib/format";

const ytQ = queryOptions({
  queryKey: ["yearly_totals"],
  queryFn: async () => {
    const { data, error } = await supabase.from("yearly_totals").select("*").order("year", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});
type Row = Awaited<ReturnType<typeof ytQ.queryFn & {}>>[number];

export const Route = createFileRoute("/_authenticated/admin/yearly-totals")({
  head: () => ({ meta: [{ title: "ஆண்டு மொத்தம் — அறம் வழிக் குழு" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ytQ),
  component: YearlyTotalsPage,
});

function YearlyTotalsPage() {
  const { data } = useSuspenseQuery(ytQ);
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Row | "new" | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["yearly_totals"] });
  const grand = data.reduce((s, r) => s + Number(r.total_amount), 0);

  async function remove(r: Row) {
    if (!confirm(`${r.year} நீக்கவா? (Delete?)`)) return;
    const { error } = await supabase.from("yearly_totals").delete().eq("id", r.id);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("நீக்கப்பட்டது (Deleted)"); refresh();
  }

  return (
    <>
      <PageHeader ta="ஆண்டு மொத்த தொகை" en="Yearly Total Amount" actions={
        <Button onClick={() => setEdit("new")}><Plus className="size-4" /> புதியது (Add New)</Button>} />
      <Panel title="ஆண்டு வாரியாக" sub={`அனைத்து ஆண்டுகள் மொத்தம் (All years): ${inr(grand)}`}>
        <DataTable empty={data.length === 0} head={[<Th ta="ஆண்டு" en="Year" />, <Th ta="மொத்த தொகை" en="Total Amount" />, <Th ta="குறிப்பு" en="Notes" />, ""]}>
          {data.map((r) => (
            <tr key={r.id}>
              <td className="font-semibold">{r.year}</td>
              <td className="tabular-nums">{inr(r.total_amount)}</td>
              <td className="text-muted-foreground">{r.notes ?? "—"}</td>
              <td className="space-x-2 text-right">
                <Button size="sm" variant="outline" onClick={() => setEdit(r)}><Pencil className="size-3.5" /> திருத்து (Edit)</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r)} aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>{edit && <YtForm row={edit === "new" ? null : edit} done={() => { setEdit(null); refresh(); }} />}</DialogContent>
      </Dialog>
    </>
  );
}

function YtForm({ row, done }: { row: Row | null; done: () => void }) {
  const [year, setYear] = useState(String(row?.year ?? new Date().getFullYear()));
  const [amount, setAmount] = useState(row ? String(row.total_amount) : "");
  const [notes, setNotes] = useState(row?.notes ?? "");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const payload = { year: Number(year), total_amount: Number(amount), notes: notes.trim() || null, updated_at: new Date().toISOString() };
    const { error } = row
      ? await supabase.from("yearly_totals").update(payload).eq("id", row.id)
      : await supabase.from("yearly_totals").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "இந்த ஆண்டு ஏற்கனவே உள்ளது (Year already exists)" : errMsg(error)); return; }
    toast.success("சேமிக்கப்பட்டது (Saved)"); done();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>{row ? "திருத்து (Edit)" : "புதிய ஆண்டு (New Year)"}</DialogTitle></DialogHeader>
      <Field label="ஆண்டு (Year)"><Input type="number" min="1990" max="2200" required value={year} onChange={(e) => setYear(e.target.value)} /></Field>
      <Field label="மொத்த தொகை (Total Amount ₹)"><Input type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="குறிப்பு (Notes)"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}
