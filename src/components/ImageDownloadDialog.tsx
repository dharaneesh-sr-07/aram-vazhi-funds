import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui-kit";
import { selectCls } from "@/lib/nav";
import { errMsg } from "@/lib/format";
import type { ImageFilters } from "@/lib/image-filters";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: { id: string; full_name: string; member_code: string }[];
  amountFields: { key: string; label: string }[];
  dateLabel?: string;
  count: (filters: ImageFilters) => number;
  download: (filters: ImageFilters) => Promise<void>;
};

export function ImageDownloadDialog(props: Props) {
  return <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto">
      {props.open && <FilterForm {...props} />}
    </DialogContent>
  </Dialog>;
}

function FilterForm({ members, amountFields, dateLabel = "தேதி (Date)", count, download, onOpenChange }: Props) {
  const initial: ImageFilters = { memberId: "all", startDate: "", endDate: "", minAmount: "", maxAmount: "", amountField: amountFields[0]?.key ?? "amount" };
  const [filters, setFilters] = useState(initial);
  const [busy, setBusy] = useState(false);
  const change = (key: keyof ImageFilters, value: string) => setFilters((f) => ({ ...f, [key]: value }));
  const invalid = (filters.startDate && filters.endDate && filters.startDate > filters.endDate)
    || (filters.minAmount !== "" && filters.maxAmount !== "" && Number(filters.minAmount) > Number(filters.maxAmount));
  const matches = count(filters);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid || !matches) return;
    setBusy(true);
    try { await download(filters); onOpenChange(false); }
    catch (error) { toast.error(errMsg(error)); }
    finally { setBusy(false); }
  }
  return <form className="space-y-4" onSubmit={submit}>
    <DialogHeader>
      <DialogTitle>படம் பதிவிறக்கம் (Image Download)</DialogTitle>
      <DialogDescription>வடிகட்டிகள் (Filters)</DialogDescription>
    </DialogHeader>
    <Field label="பெயர் (Name)">
      <select className={selectCls} value={filters.memberId} onChange={(e) => change("memberId", e.target.value)} disabled={busy}>
        <option value="all">அனைத்து உறுப்பினர்கள் (All Members)</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.full_name} — {m.member_code}</option>)}
      </select>
    </Field>
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{dateLabel}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="தொடக்க தேதி (From)"><Input type="date" value={filters.startDate} onChange={(e) => change("startDate", e.target.value)} disabled={busy} /></Field>
        <Field label="முடிவு தேதி (To)"><Input type="date" value={filters.endDate} onChange={(e) => change("endDate", e.target.value)} disabled={busy} /></Field>
      </div>
    </fieldset>
    <Field label="தொகை வகை (Amount Field)">
      <select className={selectCls} value={filters.amountField} onChange={(e) => change("amountField", e.target.value)} disabled={busy}>
        {amountFields.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
      </select>
    </Field>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="குறைந்த தொகை (Min ₹)"><Input type="number" min="0" step="0.01" value={filters.minAmount} onChange={(e) => change("minAmount", e.target.value)} disabled={busy} /></Field>
      <Field label="அதிக தொகை (Max ₹)"><Input type="number" min="0" step="0.01" value={filters.maxAmount} onChange={(e) => change("maxAmount", e.target.value)} disabled={busy} /></Field>
    </div>
    {invalid ? <p role="alert" className="text-sm text-destructive">தொடக்க மதிப்பு முடிவு மதிப்பை விட அதிகம் (Invalid range)</p>
      : <p role="status" className="text-sm text-muted-foreground">{matches} பதிவுகள் (Records)</p>}
    <div className="flex flex-wrap justify-between gap-2">
      <Button type="button" variant="outline" disabled={busy} onClick={() => setFilters(initial)}><RotateCcw className="size-4" /> மீட்டமை (Reset)</Button>
      <Button type="submit" disabled={busy || !!invalid || matches === 0}><Download className="size-4" /> {busy ? "பதிவிறக்குகிறது…" : "பதிவிறக்கு (Download)"}</Button>
    </div>
  </form>;
}