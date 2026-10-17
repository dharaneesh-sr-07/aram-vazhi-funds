import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, DataTable, Th, StatusPill, Field } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { selectCls } from "@/lib/nav";
import { inr, fmtDate, monthLabel, SUB_STATUS, today, errMsg, downloadCsv, TA_MONTHS, EN_MONTHS } from "@/lib/format";

const obQ = queryOptions({
  queryKey: ["obligations"],
  queryFn: async () => {
    const { data, error } = await supabase.from("obligation_status").select("*")
      .order("period_year", { ascending: false }).order("period_month", { ascending: false, nullsFirst: false }).order("member_code");
    if (error) throw error;
    return data ?? [];
  },
});
type Ob = Awaited<ReturnType<typeof obQ.queryFn & {}>>[number];

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  head: () => ({ meta: [{ title: "சந்தா — அறம் வழிக் குழு" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(obQ),
  component: SubsPage,
});

function SubsPage() {
  const { data } = useSuspenseQuery(obQ);
  const qc = useQueryClient();
  const now = new Date();
  const [type, setType] = useState<"monthly" | "yearly">("monthly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState("all");
  const [pay, setPay] = useState<Ob | null>(null);
  const [edit, setEdit] = useState<Ob | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["obligations"] });

  async function generate() {
    const { data: n, error } = await supabase.rpc("generate_obligations", { _type: type, _year: year, ...(type === "monthly" ? { _month: month } : {}) });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`${n} புதிய பதிவுகள் (${n} created)`);
    refresh();
  }

  const rows = data.filter((r) => filter === "all" || r.status === filter);
  return (
    <>
      <PageHeader ta="சந்தா" en="Subscriptions" actions={
        <Button variant="outline" onClick={() => downloadCsv("avk-subscriptions.csv", [["Code", "Name", "Type", "Month", "Year", "Due", "Paid", "Remaining", "Status"], ...rows.map((r) => [r.member_code, r.full_name, r.payment_type, r.period_month, r.period_year, r.amount_due, r.amount_paid, r.remaining, r.status])])}>
          <Download className="size-4" /> CSV
        </Button>} />
      <Panel title="சந்தா உருவாக்கு" sub="Generate dues for all active members" className="mb-6">
        <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <Field label="வகை (Type)">
            <select className={selectCls} value={type} onChange={(e) => setType(e.target.value as "monthly" | "yearly")}>
              <option value="monthly">மாதம் (Monthly)</option><option value="yearly">ஆண்டு (Yearly)</option>
            </select>
          </Field>
          <Field label="ஆண்டு (Year)"><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></Field>
          {type === "monthly" && (
            <Field label="மாதம் (Month)">
              <select className={selectCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {TA_MONTHS.map((t, i) => <option key={i} value={i + 1}>{t} ({EN_MONTHS[i]})</option>)}
              </select>
            </Field>
          )}
          <Button onClick={generate}>உருவாக்கு (Generate)</Button>
        </div>
      </Panel>
      <Panel title="சந்தா பட்டியல்" sub="Dues & payments" actions={
        <select className={selectCls + " w-44"} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">அனைத்தும் (All)</option>
          {Object.entries(SUB_STATUS).map(([k, v]) => <option key={k} value={k}>{v.ta} ({v.en})</option>)}
        </select>}>
        <DataTable empty={rows.length === 0} head={[<Th ta="உறுப்பினர்" en="Member" />, <Th ta="வகை" en="Type" />, <Th ta="காலம்" en="Period" />, <Th ta="தொகை" en="Due" />, <Th ta="செலுத்தியது" en="Paid" />, <Th ta="மீதம்" en="Remaining" />, <Th ta="நிலை" en="Status" />, ""]}>
          {rows.map((r) => {
            const s = SUB_STATUS[r.status ?? "pending"] ?? SUB_STATUS[Object.keys(SUB_STATUS)[0]!]!;
            return (
              <tr key={r.id}>
                <td><span className="font-medium">{r.full_name}</span> <span className="font-mono text-xs text-muted-foreground">{r.member_code}</span></td>
                <td>{r.payment_type === "monthly" ? "மாதம்" : "ஆண்டு"}</td>
                <td>{r.payment_type === "monthly" ? monthLabel(r.period_month) + " " : ""}{r.period_year}</td>
                <td className="tabular-nums">{inr(r.amount_due)}</td>
                <td className="tabular-nums">{inr(r.amount_paid)}</td>
                <td className="tabular-nums">{inr(r.remaining)}</td>
                <td><StatusPill tone={s.tone}>{s.ta}</StatusPill></td>
                <td className="space-x-2 whitespace-nowrap text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEdit(r)}>திருத்து (Edit)</Button>
                  {Number(r.remaining) > 0 && <Button size="sm" variant="outline" onClick={() => setPay(r)}>பணம் பெறு (Pay)</Button>}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
      <Dialog open={!!pay} onOpenChange={(o) => !o && setPay(null)}>
        <DialogContent>{pay && <PayForm ob={pay} done={() => { setPay(null); refresh(); }} />}</DialogContent>
      </Dialog>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>{edit && <EditForm ob={edit} done={() => { setEdit(null); refresh(); }} />}</DialogContent>
      </Dialog>
    </>
  );
}

function EditForm({ ob, done }: { ob: Ob; done: () => void }) {
  const [amount, setAmount] = useState(String(ob.amount_due ?? ""));
  const [year, setYear] = useState(Number(ob.period_year));
  const [month, setMonth] = useState(Number(ob.period_month ?? 1));
  const [busy, setBusy] = useState(false);
  const monthly = ob.payment_type === "monthly";
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    if (year !== ob.period_year || (monthly && month !== ob.period_month)) {
      const { error } = await supabase.rpc("update_obligation_period", { _obligation_id: ob.id!, _year: year, ...(monthly ? { _month: month } : {}) });
      if (error) { setBusy(false); toast.error(errMsg(error)); return; }
    }
    if (Number(amount) !== Number(ob.amount_due)) {
      const { error } = await supabase.rpc("update_obligation_amount", { _obligation_id: ob.id!, _amount: Number(amount) });
      if (error) { setBusy(false); toast.error(errMsg(error)); return; }
    }
    setBusy(false);
    toast.success("சேமிக்கப்பட்டது (Saved)"); done();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>சந்தா திருத்து — {ob.full_name}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">செலுத்தியது (Paid): {inr(ob.amount_paid)}</p>
      <Field label="ஆண்டு (Year)"><Input type="number" min={2000} max={2100} required value={year} onChange={(e) => setYear(Number(e.target.value))} /></Field>
      {monthly && (
        <Field label="மாதம் (Month)">
          <select className={selectCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {TA_MONTHS.map((t, i) => <option key={i} value={i + 1}>{t} ({EN_MONTHS[i]})</option>)}
          </select>
        </Field>
      )}
      <Field label="செலுத்த வேண்டிய தொகை (Amount Due ₹)"><Input type="number" step="0.01" min={Math.max(0.01, Number(ob.amount_paid ?? 0))} required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}

function PayForm({ ob, done }: { ob: Ob; done: () => void }) {
  const [amount, setAmount] = useState(String(ob.remaining ?? ""));
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.rpc("record_subscription_payment", { _obligation_id: ob.id!, _amount: Number(amount), _date: date, _notes: notes });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`ரசீது ${data} (Receipt saved)`); done();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>சந்தா பணம் — {ob.full_name}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">மீதம் (Remaining): {inr(ob.remaining)} · {fmtDate(ob.last_payment_date)}</p>
      <Field label="தொகை (Amount ₹)"><Input type="number" step="0.01" min="0.01" max={Number(ob.remaining)} required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="தேதி (Date)"><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="குறிப்பு (Notes)"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}
