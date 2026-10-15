import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createMember, updateMember, setMemberStatus, resetMemberPassword } from "@/lib/admin.functions";
import { PageHeader, Panel, DataTable, Th, StatusPill, Field } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { selectCls } from "@/lib/nav";
import { fmtDate, errMsg } from "@/lib/format";

const membersQ = queryOptions({
  queryKey: ["members"],
  queryFn: async () => {
    const [{ data: m, error }, { data: r }] = await Promise.all([
      supabase.from("members").select("*").order("member_code"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    if (error) throw error;
    const admins = new Set((r ?? []).filter((x) => x.role === "admin").map((x) => x.user_id));
    return (m ?? []).map((x) => ({ ...x, role: (admins.has(x.auth_user_id ?? "") ? "admin" : "member") as "admin" | "member" }));
  },
});
type Row = Awaited<ReturnType<typeof membersQ.queryFn & {}>>[number];

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () => ({ meta: [{ title: "உறுப்பினர்கள் — அறம் வழிக் குழு" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(membersQ),
  component: MembersPage,
});

function MembersPage() {
  const { data } = useSuspenseQuery(membersQ);
  const qc = useQueryClient();
  const [dlg, setDlg] = useState<{ kind: "new" } | { kind: "edit" | "reset"; row: Row } | null>(null);
  const setStatus = useServerFn(setMemberStatus);
  const refresh = () => qc.invalidateQueries({ queryKey: ["members"] });

  async function toggle(row: Row) {
    const next = row.status === "active" ? "inactive" : "active";
    if (!confirm(next === "inactive" ? `${row.full_name} — முடக்கவா? (Deactivate?)` : `${row.full_name} — மீண்டும் செயல்படுத்தவா? (Reactivate?)`)) return;
    try {
      const r = await setStatus({ data: { memberId: row.id, status: next } });
      if (!r.ok) return toast.error(r.error);
      toast.success("மாற்றப்பட்டது (Updated)");
      refresh();
    } catch (e) { toast.error(errMsg(e)); }
  }

  return (
    <>
      <PageHeader ta="உறுப்பினர்கள்" en="Members" actions={<Button onClick={() => setDlg({ kind: "new" })}><UserPlus className="size-4" /> புதிய உறுப்பினர் (Add)</Button>} />
      <Panel>
        <DataTable empty={data.length === 0} head={[<Th ta="குறியீடு" en="Code" />, <Th ta="பெயர்" en="Name" />, <Th ta="பயனர்பெயர்" en="Username" />, <Th ta="பங்கு" en="Role" />, <Th ta="நிலை" en="Status" />, <Th ta="சேர்ந்தது" en="Joined" />, ""]}>
          {data.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs">{r.member_code}</td>
              <td className="font-medium">{r.full_name}</td>
              <td>{r.username}</td>
              <td>{r.role === "admin" ? "நிர்வாகி (Admin)" : "உறுப்பினர் (Member)"}</td>
              <td><StatusPill tone={r.status === "active" ? "success" : "danger"}>{r.status === "active" ? "செயலில் (Active)" : "முடக்கம் (Inactive)"}</StatusPill></td>
              <td>{fmtDate(r.created_at)}</td>
              <td className="whitespace-nowrap text-right">
                <Button size="sm" variant="ghost" onClick={() => setDlg({ kind: "edit", row: r })}>திருத்து</Button>
                <Button size="sm" variant="ghost" onClick={() => setDlg({ kind: "reset", row: r })}>கடவுச்சொல்</Button>
                <Button size="sm" variant="ghost" onClick={() => toggle(r)}>{r.status === "active" ? "முடக்கு" : "செயல்படுத்து"}</Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Dialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent>
          {dlg?.kind === "new" && <NewForm done={() => { setDlg(null); refresh(); }} />}
          {dlg?.kind === "edit" && <EditForm row={dlg.row} done={() => { setDlg(null); refresh(); }} />}
          {dlg?.kind === "reset" && <ResetForm row={dlg.row} done={() => setDlg(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function NewForm({ done }: { done: () => void }) {
  const fn = useServerFn(createMember);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ fullName: "", username: "", role: "member" as "admin" | "member", tempPassword: "" });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const r = await fn({ data: f });
      if (!r.ok) return toast.error(r.error);
      toast.success(`உருவாக்கப்பட்டது: ${r.memberCode} (Created)`);
      done();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>புதிய உறுப்பினர் (New member)</DialogTitle></DialogHeader>
      <Field label="முழுப் பெயர் (Full name)"><Input required value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
      <Field label="பயனர்பெயர் (Username)"><Input required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
      <Field label="பங்கு (Role)">
        <select className={selectCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "admin" | "member" })}>
          <option value="member">உறுப்பினர் (Member)</option><option value="admin">நிர்வாகி (Admin)</option>
        </select>
      </Field>
      <Field label="தற்காலிக கடவுச்சொல் (Temporary password, min 8)"><Input required minLength={8} value={f.tempPassword} onChange={(e) => setF({ ...f, tempPassword: e.target.value })} /></Field>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "சேமிக்கிறது…" : "உருவாக்கு (Create)"}</Button>
    </form>
  );
}

function EditForm({ row, done }: { row: Row; done: () => void }) {
  const fn = useServerFn(updateMember);
  const [busy, setBusy] = useState(false);
  const [fullName, setName] = useState(row.full_name);
  const [role, setRole] = useState(row.role);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const r = await fn({ data: { memberId: row.id, fullName, role } });
      if (!r.ok) return toast.error(r.error);
      toast.success("சேமிக்கப்பட்டது (Saved)"); done();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>திருத்து — {row.member_code}</DialogTitle></DialogHeader>
      <Field label="முழுப் பெயர் (Full name)"><Input required value={fullName} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="பங்கு (Role)">
        <select className={selectCls} value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")}>
          <option value="member">உறுப்பினர் (Member)</option><option value="admin">நிர்வாகி (Admin)</option>
        </select>
      </Field>
      <Button type="submit" disabled={busy} className="w-full">சேமி (Save)</Button>
    </form>
  );
}

function ResetForm({ row, done }: { row: Row; done: () => void }) {
  const fn = useServerFn(resetMemberPassword);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const r = await fn({ data: { memberId: row.id, tempPassword: pw } });
      if (!r.ok) return toast.error(r.error);
      toast.success("கடவுச்சொல் மாற்றப்பட்டது (Password reset)"); done();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader><DialogTitle>கடவுச்சொல் மீட்டமை — {row.full_name}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">அடுத்த உள்நுழைவில் உறுப்பினர் புதிய கடவுச்சொல் அமைக்க வேண்டும். (Member must change it at next login.)</p>
      <Field label="தற்காலிக கடவுச்சொல் (Temporary password)"><Input required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">மீட்டமை (Reset)</Button>
    </form>
  );
}
