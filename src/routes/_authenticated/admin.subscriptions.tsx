import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, DataTable, Th, StatusPill, Field } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { selectCls } from "@/lib/nav";
import { inr, fmtDate, monthLabel, SUB_STATUS, today, errMsg, TA_MONTHS, EN_MONTHS } from "@/lib/format";
import { downloadTableImage } from "@/lib/export-image";
import { ImageDownloadDialog } from "@/components/ImageDownloadDialog";
import { matchesImageFilters, subscriptionPeriodDate, type ImageFilters } from "@/lib/image-filters";
import { asFinanceObligations, calculateMonthlyMemberDues } from "@/lib/finance-summary";

const obQ = queryOptions({
  queryKey: ["obligations"],
  queryFn: async () => {
    const { data, error } = await supabase.from("obligation_status").select("*")
      .order("period_year", { ascending: false }).order("period_month", { ascending: false, nullsFirst: false }).order("member_code");
    if (error) throw error;
    return data ?? [];
  },
});
type Ob = Awaited<ReturnType<NonNullable<typeof obQ.queryFn>>>[number];

const membersQ = queryOptions({
  queryKey: ["members-pick"],
  queryFn: async () => {
    const { data, error } = await supabase.from("members").select("id,full_name,member_code,status,joined_on,created_at").order("member_code");
    if (error) throw error;
    return data ?? [];
  },
});

const receiptsQ = queryOptions({
  queryKey: ["subscription-receipts"],
  queryFn: async () => {
    const { data, error } = await supabase.from("subscription_receipts").select("id,receipt_code,obligation_id,amount_paid,payment_date,payment_year,notes")
      .order("payment_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});
type Receipt = Awaited<ReturnType<NonNullable<typeof receiptsQ.queryFn>>>[number];

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  head: () => ({ meta: [{ title: "சந்தா — அறம் வழிக் குழு" }, { name: "description", content: "மாத சந்தா மற்றும் புடவைப் பணம் வசூல், நிலுவை மாதங்கள் மற்றும் ரசீது வரலாறு." }, { property: "og:title", content: "சந்தா — அறம் வழிக் குழு" }, { property: "og:description", content: "மாத சந்தா மற்றும் புடவைப் பணம் வசூல், நிலுவை மாதங்கள் மற்றும் ரசீது வரலாறு." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(obQ),
    context.queryClient.ensureQueryData(membersQ),
    context.queryClient.ensureQueryData(receiptsQ),
  ]),
  component: SubsPage,
});

function SubsPage() {
  const { data: allRows } = useSuspenseQuery(obQ);
  const { data: members } = useSuspenseQuery(membersQ);
  const { data: receipts } = useSuspenseQuery(receiptsQ);
  const qc = useQueryClient();
  const now = new Date();
  const currentYear = now.getFullYear();
  const [type, setType] = useState<"monthly" | "yearly">("monthly");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [listType, setListType] = useState("all");
  const [listYear, setListYear] = useState(String(currentYear));
  const [search, setSearch] = useState("");
  const [pay, setPay] = useState<Ob | null>(null);
  const [edit, setEdit] = useState<Ob | null>(null);
  const [receiptEdit, setReceiptEdit] = useState<Receipt | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(members.filter((m) => m.status === "active").map((m) => m.id)));
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ["obligations"] }),
    qc.invalidateQueries({ queryKey: ["subscription-receipts"] }),
    qc.invalidateQueries({ queryKey: ["admin-finance"] }),
    qc.invalidateQueries({ queryKey: ["admin-dash"] }),
    qc.invalidateQueries({ queryKey: ["my-records"] }),
  ]);
  const toggle = (id: string) => setPicked((selected) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const years = Array.from(new Set([currentYear, ...allRows.flatMap((row) => row.period_year == null ? [] : [row.period_year])])).sort((a, b) => b - a);

  async function generate() {
    if (picked.size === 0) { toast.error("உறுப்பினர்களைத் தேர்ந்தெடுக்கவும் (Select members)"); return; }
    const { data: created, error } = await supabase.rpc("generate_obligations_for", {
      _type: type,
      _year: year,
      _member_ids: [...picked],
      ...(type === "monthly" ? { _month: month } : {}),
    });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`${created} புதிய பதிவுகள் (${created} created)`);
    await refresh();
  }

  const rows = allRows.filter((row) =>
    (listYear === "all" || row.period_year === Number(listYear))
    && (listType === "all" || row.payment_type === listType)
    && (statusFilter === "all" || row.status === statusFilter)
    && (!search.trim() || `${row.full_name ?? ""} ${row.member_code ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const obligationById = new Map(allRows.flatMap((row) => row.id ? [[row.id, row] as const] : []));
  const receiptRows = receipts.filter((receipt) => {
    const obligation = obligationById.get(receipt.obligation_id);
    return Boolean(obligation)
      && (listYear === "all" || receipt.payment_year === Number(listYear))
      && (listType === "all" || obligation?.payment_type === listType)
      && (!search.trim() || `${obligation?.full_name ?? ""} ${obligation?.member_code ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  });
  const filterYear = listYear === "all" ? currentYear : Number(listYear);
  const monthlyDues = calculateMonthlyMemberDues(filterYear, members, asFinanceObligations(allRows), now);
  const exportRows = (filters: ImageFilters) => rows.filter((row) => matchesImageFilters({
    memberId: row.member_id,
    date: subscriptionPeriodDate(row.period_year, row.period_month),
    amount: filters.amountField === "paid" ? row.amount_paid : filters.amountField === "remaining" ? row.remaining : row.amount_due,
  }, filters));
  const downloadImage = (filters: ImageFilters) => downloadTableImage(
    "avk-subscriptions.png",
    "சந்தா விவரம் (Subscriptions)",
    ["எண் (ID)", "பெயர் (Name)", "வகை (Type)", "காலம் (Period)", "தொகை (Due)", "செலுத்தியது (Paid)", "மீதம் (Remaining)", "நிலை (Status)"],
    exportRows(filters).map((row) => [row.member_code, row.full_name, row.payment_type === "monthly" ? "மாதம்" : "ஆண்டு", (row.payment_type === "monthly" ? monthLabel(row.period_month) + " " : "") + row.period_year, inr(row.amount_due), inr(row.amount_paid), inr(row.remaining), SUB_STATUS[row.status ?? ""]?.ta ?? row.status]),
  );

  async function deleteReceipt(receipt: Receipt) {
    if (!confirm(`${receipt.receipt_code} — நீக்கவா? (Delete receipt?)`)) return;
    const { error } = await supabase.rpc("delete_subscription_receipt", { _receipt_id: receipt.id });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("ரசீது நீக்கப்பட்டது (Receipt deleted)");
    await refresh();
  }

  return (
    <>
      <ImageDownloadDialog open={imageOpen} onOpenChange={setImageOpen} members={members}
        dateLabel="சந்தா காலத் தேதி (Subscription Period Date)"
        amountFields={[{ key: "due", label: "தொகை (Due)" }, { key: "paid", label: "செலுத்தியது (Paid)" }, { key: "remaining", label: "மீதம் (Remaining)" }]}
        count={(filters) => exportRows(filters).length} download={downloadImage} />
      <PageHeader ta="சந்தா" en="Monthly Subscription & Saree Fund" actions={
        <Button variant="outline" onClick={() => setImageOpen(true)}><Download className="size-4" /> படம் (Image)</Button>
      } />

      <Panel title="சந்தா உருவாக்கு" sub="Generate dues for chosen members" className="mb-6">
        <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <Field label="வகை (Type)">
            <select className={selectCls} value={type} onChange={(event) => setType(event.target.value as "monthly" | "yearly")}>
              <option value="monthly">மாத சந்தா (Monthly)</option><option value="yearly">புடவைப் பணம் (Yearly Saree Fund)</option>
            </select>
          </Field>
          <Field label="ஆண்டு (Year)"><Input type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(Number(event.target.value))} /></Field>
          {type === "monthly" && (
            <Field label="மாதம் (Month)">
              <select className={selectCls} value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                {TA_MONTHS.map((label, index) => <option key={label} value={index + 1}>{label} ({EN_MONTHS[index]})</option>)}
              </select>
            </Field>
          )}
          <Button onClick={generate}>உருவாக்கு (Generate)</Button>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">உறுப்பினர்கள் (Members) — {picked.size}/{members.length}</span>
            <Button size="sm" variant="ghost" onClick={() => setPicked(new Set(members.map((member) => member.id)))}>அனைத்தும் (All)</Button>
            <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>எதுவுமில்லை (None)</Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {members.map((member) => (
              <label key={member.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <input type="checkbox" className="accent-primary" checked={picked.has(member.id)} onChange={() => toggle(member.id)} />
                <span className="truncate">{member.full_name}</span>
                <span className="font-mono text-xs text-muted-foreground">{member.member_code}</span>
              </label>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title={`${filterYear} மாத சந்தா நிலுவை`} sub="Unpaid months calculated from joining date" className="mb-6">
        <DataTable empty={monthlyDues.length === 0} head={[<Th ta="உறுப்பினர்" en="Member" />, <Th ta="செலுத்தாத மாதங்கள்" en="Unpaid months" />, <Th ta="நிலுவை" en="Pending amount" />]}>
          {monthlyDues.map((row) => (
            <tr key={row.memberId}>
              <td><span className="font-medium">{row.memberName}</span> <span className="font-mono text-xs text-muted-foreground">{row.memberCode}</span></td>
              <td>{row.unpaidMonths.length ? row.unpaidMonths.map(monthLabel).join(" · ") : "நிலுவை இல்லை (Clear)"}</td>
              <td className="tabular-nums">{inr(row.pendingAmount)}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="சந்தா நிலுவைகள்" sub="Dues and payment status" className="mb-6" actions={
        <div className="grid w-full gap-2 sm:grid-cols-4">
          <Input aria-label="உறுப்பினர் தேடல் (Search members)" placeholder="பெயர் தேடல் (Search name)" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="ஆண்டு வடிகட்டி (Filter year)" className={selectCls} value={listYear} onChange={(event) => setListYear(event.target.value)}>
            <option value="all">அனைத்து ஆண்டுகள் (All years)</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="வகை வடிகட்டி (Filter type)" className={selectCls} value={listType} onChange={(event) => setListType(event.target.value)}>
            <option value="all">அனைத்து வகைகள் (All types)</option><option value="monthly">மாத சந்தா (Monthly)</option><option value="yearly">புடவைப் பணம் (Yearly)</option>
          </select>
          <select aria-label="நிலை வடிகட்டி (Filter status)" className={selectCls} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">அனைத்து நிலைகள் (All statuses)</option>{Object.entries(SUB_STATUS).map(([key, value]) => <option key={key} value={key}>{value.ta} ({value.en})</option>)}
          </select>
        </div>
      }>
        <DataTable empty={rows.length === 0} head={[<Th ta="உறுப்பினர்" en="Member" />, <Th ta="வகை" en="Type" />, <Th ta="காலம்" en="Period" />, <Th ta="தொகை" en="Due" />, <Th ta="செலுத்தியது" en="Paid" />, <Th ta="மீதம்" en="Remaining" />, <Th ta="நிலை" en="Status" />, ""]}>
          {rows.map((row) => {
            const status = SUB_STATUS[row.status ?? "pending"] ?? { ta: "நிலுவையில்", en: "Pending", tone: "muted" as const };
            return (
              <tr key={row.id ?? `${row.member_id}-${row.period_year}-${row.period_month}`}>
                <td><span className="font-medium">{row.full_name}</span> <span className="font-mono text-xs text-muted-foreground">{row.member_code}</span></td>
                <td>{row.payment_type === "monthly" ? "மாத சந்தா" : "புடவைப் பணம்"}</td>
                <td>{row.payment_type === "monthly" ? `${monthLabel(row.period_month)} ` : ""}{row.period_year}</td>
                <td className="tabular-nums">{inr(row.amount_due)}</td>
                <td className="tabular-nums">{inr(row.amount_paid)}</td>
                <td className="tabular-nums">{inr(row.remaining)}</td>
                <td><StatusPill tone={status.tone}>{status.ta}</StatusPill></td>
                <td className="space-x-2 whitespace-nowrap text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEdit(row)}>திருத்து (Edit)</Button>
                  {Number(row.remaining) > 0 && <Button size="sm" variant="outline" onClick={() => setPay(row)}>பணம் பெறு (Pay)</Button>}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>

      <Panel title="சந்தா ரசீது வரலாறு" sub="Subscription transaction history">
        <DataTable empty={receiptRows.length === 0} head={[<Th ta="ரசீது" en="Receipt" />, <Th ta="உறுப்பினர்" en="Member" />, <Th ta="வகை" en="Type" />, <Th ta="தேதி" en="Date" />, <Th ta="தொகை" en="Amount" />, <Th ta="விளக்கம்" en="Description" />, ""]}>
          {receiptRows.map((receipt) => {
            const obligation = obligationById.get(receipt.obligation_id);
            return (
              <tr key={receipt.id}>
                <td className="font-mono text-xs">{receipt.receipt_code}</td>
                <td>{obligation?.full_name} <span className="font-mono text-xs text-muted-foreground">{obligation?.member_code}</span></td>
                <td>{obligation?.payment_type === "monthly" ? "மாத சந்தா" : "புடவைப் பணம்"}</td>
                <td>{fmtDate(receipt.payment_date)}</td>
                <td className="tabular-nums">{inr(receipt.amount_paid)}</td>
                <td>{receipt.notes ?? "—"}</td>
                <td className="whitespace-nowrap text-right">
                  <Button size="icon" variant="ghost" aria-label={`திருத்து ${receipt.receipt_code}`} title="திருத்து (Edit)" onClick={() => setReceiptEdit(receipt)}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`நீக்கு ${receipt.receipt_code}`} title="நீக்கு (Delete)" onClick={() => deleteReceipt(receipt)}><Trash2 className="size-4 text-destructive" /></Button>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>

      <Dialog open={!!pay} onOpenChange={(open) => !open && setPay(null)}>
        <DialogContent>{pay && <PayForm ob={pay} done={() => { setPay(null); void refresh(); }} />}</DialogContent>
      </Dialog>
      <Dialog open={!!edit} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent>{edit && <EditForm ob={edit} done={() => { setEdit(null); void refresh(); }} />}</DialogContent>
      </Dialog>
      <Dialog open={!!receiptEdit} onOpenChange={(open) => !open && setReceiptEdit(null)}>
        <DialogContent>{receiptEdit && <ReceiptEditForm receipt={receiptEdit} done={() => { setReceiptEdit(null); void refresh(); }} />}</DialogContent>
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
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ob.id) { toast.error("பதிவை காணவில்லை (Record unavailable)"); return; }
    setBusy(true);
    if (year !== ob.period_year || (monthly && month !== ob.period_month)) {
      const { error } = await supabase.rpc("update_obligation_period", { _obligation_id: ob.id, _year: year, ...(monthly ? { _month: month } : {}) });
      if (error) { setBusy(false); toast.error(errMsg(error)); return; }
    }
    if (Number(amount) !== Number(ob.amount_due)) {
      const { error } = await supabase.rpc("update_obligation_amount", { _obligation_id: ob.id, _amount: Number(amount) });
      if (error) { setBusy(false); toast.error(errMsg(error)); return; }
    }
    setBusy(false);
    toast.success("சேமிக்கப்பட்டது (Saved)");
    done();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>சந்தா திருத்து — {ob.full_name}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">செலுத்தியது (Paid): {inr(ob.amount_paid)}</p>
      <Field label="ஆண்டு (Year)"><Input type="number" min={2000} max={2100} required value={year} onChange={(event) => setYear(Number(event.target.value))} /></Field>
      {monthly && <Field label="மாதம் (Month)"><select className={selectCls} value={month} onChange={(event) => setMonth(Number(event.target.value))}>{TA_MONTHS.map((label, index) => <option key={label} value={index + 1}>{label} ({EN_MONTHS[index]})</option>)}</select></Field>}
      <Field label="செலுத்த வேண்டிய தொகை (Amount Due ₹)"><Input type="number" step="0.01" min={Math.max(0.01, Number(ob.amount_paid ?? 0))} required value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}

function PayForm({ ob, done }: { ob: Ob; done: () => void }) {
  const [amount, setAmount] = useState(String(ob.remaining ?? ""));
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ob.id) { toast.error("பதிவை காணவில்லை (Record unavailable)"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("record_subscription_payment", { _obligation_id: ob.id, _amount: Number(amount), _date: date, _notes: notes });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`ரசீது ${data} (Receipt saved)`);
    done();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>சந்தா பணம் — {ob.full_name}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">மீதம் (Remaining): {inr(ob.remaining)} · {fmtDate(ob.last_payment_date)}</p>
      <Field label="தொகை (Amount ₹)"><Input type="number" step="0.01" min="0.01" max={Number(ob.remaining)} required value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
      <Field label="தேதி (Date)"><Input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></Field>
      <Field label="விளக்கம் (Description)"><Input value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}

function ReceiptEditForm({ receipt, done }: { receipt: Receipt; done: () => void }) {
  const [amount, setAmount] = useState(String(receipt.amount_paid));
  const [date, setDate] = useState(receipt.payment_date);
  const [notes, setNotes] = useState(receipt.notes ?? "");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("update_subscription_receipt", { _receipt_id: receipt.id, _amount: Number(amount), _date: date, _notes: notes });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("ரசீது திருத்தப்பட்டது (Receipt updated)");
    done();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>ரசீது திருத்து — {receipt.receipt_code}</DialogTitle></DialogHeader>
      <Field label="தொகை (Amount ₹)"><Input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
      <Field label="தேதி (Date)"><Input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></Field>
      <Field label="விளக்கம் (Description)"><Input value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}