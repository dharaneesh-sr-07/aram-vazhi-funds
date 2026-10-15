import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, DataTable, Th, StatusPill, Field } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { selectCls } from "@/lib/nav";
import { inr, fmtDate, MT_STATUS, today, errMsg, downloadCsv } from "@/lib/format";

const moneyQ = queryOptions({
  queryKey: ["money"],
  queryFn: async () => {
    const [t, r, m] = await Promise.all([
      supabase.from("money_taken_status").select("*").order("taken_date", { ascending: false }),
      supabase.from("money_returned").select("*").order("payment_date", { ascending: false }),
      supabase.from("members").select("id,full_name,member_code").eq("status", "active").order("member_code"),
    ]);
    if (t.error) throw t.error;
    return { taken: t.data ?? [], returned: r.data ?? [], members: m.data ?? [] };
  },
});
type Taken = Awaited<ReturnType<typeof moneyQ.queryFn & {}>>["taken"][number];

export const Route = createFileRoute("/_authenticated/admin/money")({
  head: () => ({ meta: [{ title: "கடன் / திருப்பம் — அறம் வழிக் குழு" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(moneyQ),
  component: MoneyPage,
});

function MoneyPage() {
  const { data } = useSuspenseQuery(moneyQ);
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [ret, setRet] = useState<Taken | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["money"] });
  const codeOf = new Map(data.taken.map((t) => [t.id, t]));

  return (
    <>
      <PageHeader ta="கடன் / திருப்பம்" en="Money Taken & Returned" actions={<>
        <Button variant="outline" onClick={() => downloadCsv("avk-money-taken.csv", [["Code", "Member", "Date", "Taken", "Extra", "Total", "Returned", "Remaining", "Status"], ...data.taken.map((t) => [t.transaction_code, t.full_name, t.taken_date, t.amount_taken, t.extra_amount, t.total_to_return, t.amount_returned, t.remaining, t.status])])}><Download className="size-4" /> CSV</Button>
        <Button onClick={() => setNewOpen(true)}><Plus className="size-4" /> புதிய கடன் (New)</Button>
      </>} />
      <Panel title="கடன் பதிவுகள்" sub="Money taken" className="mb-6">
        <DataTable empty={data.taken.length === 0} head={[<Th ta="குறியீடு" en="Code" />, <Th ta="உறுப்பினர்" en="Member" />, <Th ta="தேதி" en="Date" />, <Th ta="தொகை" en="Taken" />, <Th ta="கூடுதல்" en="Extra" />, <Th ta="மொத்தம்" en="Total" />, <Th ta="மீதம்" en="Remaining" />, <Th ta="நிலை" en="Status" />, ""]}>
          {data.taken.map((t) => {
            const s = MT_STATUS[t.status ?? "active"] ?? MT_STATUS[Object.keys(MT_STATUS)[0]!]!;
            return (
              <tr key={t.id}>
                <td className="font-mono text-xs">{t.transaction_code}</td>
                <td>{t.full_name}</td>
                <td>{fmtDate(t.taken_date)}</td>
                <td className="tabular-nums">{inr(t.amount_taken)}</td>
                <td className="tabular-nums">{inr(t.extra_amount)}</td>
                <td className="tabular-nums">{inr(t.total_to_return)}</td>
                <td className="tabular-nums">{inr(t.remaining)}</td>
                <td><StatusPill tone={s.tone}>{s.ta}</StatusPill></td>
                <td className="text-right">{Number(t.remaining) > 0 && <Button size="sm" variant="outline" onClick={() => setRet(t)}>திருப்பம் (Return)</Button>}</td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
      <Panel title="திருப்பிய பதிவுகள்" sub="Money returned">
        <DataTable empty={data.returned.length === 0} head={[<Th ta="குறியீடு" en="Code" />, <Th ta="கடன்" en="Loan" />, <Th ta="உறுப்பினர்" en="Member" />, <Th ta="தேதி" en="Date" />, <Th ta="தொகை" en="Amount" />, <Th ta="குறிப்பு" en="Notes" />]}>
          {data.returned.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs">{r.return_code}</td>
              <td className="font-mono text-xs">{codeOf.get(r.money_taken_id)?.transaction_code}</td>
              <td>{codeOf.get(r.money_taken_id)?.full_name}</td>
              <td>{fmtDate(r.payment_date)}</td>
              <td className="tabular-nums">{inr(r.amount_returned)}</td>
              <td className="text-muted-foreground">{r.notes ?? "—"}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>{newOpen && <TakenForm members={data.members} done={() => { setNewOpen(false); refresh(); }} />}</DialogContent>
      </Dialog>
      <Dialog open={!!ret} onOpenChange={(o) => !o && setRet(null)}>
        <DialogContent>{ret && <ReturnForm t={ret} done={() => { setRet(null); refresh(); }} />}</DialogContent>
      </Dialog>
    </>
  );
}

function TakenForm({ members, done }: { members: { id: string; full_name: string; member_code: string }[]; done: () => void }) {
  const [f, setF] = useState({ member: members[0]?.id ?? "", date: today(), amount: "", extra: "0", notes: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.rpc("record_money_taken", { _member_id: f.member, _date: f.date, _amount: Number(f.amount), _extra: Number(f.extra || 0), _notes: f.notes });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`பதிவு ${data} (Saved)`); done();
  }
  const total = Number(f.amount || 0) + Number(f.extra || 0);
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>புதிய கடன் (Money taken)</DialogTitle></DialogHeader>
      <Field label="உறுப்பினர் (Member)">
        <select className={selectCls} required value={f.member} onChange={(e) => setF({ ...f, member: e.target.value })}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.member_code} — {m.full_name}</option>)}
        </select>
      </Field>
      <Field label="தேதி (Date)"><Input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="தொகை (Amount ₹)"><Input type="number" step="0.01" min="0.01" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="கூடுதல் (Extra ₹)"><Input type="number" step="0.01" min="0" value={f.extra} onChange={(e) => setF({ ...f, extra: e.target.value })} /></Field>
      </div>
      <p className="text-sm">திருப்ப வேண்டிய மொத்தம் (Total to return): <b>{inr(total)}</b></p>
      <Field label="குறிப்பு (Notes)"><Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}

function ReturnForm({ t, done }: { t: Taken; done: () => void }) {
  const [amount, setAmount] = useState(String(t.remaining ?? ""));
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.rpc("record_money_returned", { _money_taken_id: t.id!, _amount: Number(amount), _date: date, _notes: notes });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`பதிவு ${data} (Saved)`); done();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>திருப்பம் — {t.transaction_code}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">{t.full_name} · மீதம் (Remaining): {inr(t.remaining)}</p>
      <Field label="தொகை (Amount ₹)"><Input type="number" step="0.01" min="0.01" max={Number(t.remaining)} required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="தேதி (Date)"><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="குறிப்பு (Notes)"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}
