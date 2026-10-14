import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, LockKeyhole, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeOwnPassword } from "@/lib/auth.functions";
import { signOut } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/change-password")({
  head: () => ({ meta: [{ title: "கடவுச்சொல் மாற்றம் — அறம் வழிக் குழு" }] }),
  component: ChangePassword,
});

const rules = [
  { test: (p: string) => p.length >= 10, label: "குறைந்தது 10 எழுத்துகள் (10+ characters)" },
  { test: (p: string) => /[A-Z]/.test(p), label: "பெரிய எழுத்து (Uppercase)" },
  { test: (p: string) => /[a-z]/.test(p), label: "சிறிய எழுத்து (Lowercase)" },
  { test: (p: string) => /[0-9]/.test(p), label: "எண் (Number)" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "சிறப்பு குறியீடு (Symbol)" },
];

function ChangePassword() {
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const change = useServerFn(changeOwnPassword);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const current = String(new FormData(e.currentTarget).get("current"));
    if (pw !== confirm) return setError("கடவுச்சொற்கள் பொருந்தவில்லை (Passwords do not match)");
    setLoading(true);
    setError(null);
    try {
      const r = await change({ data: { currentPassword: current, newPassword: pw } });
      if (!r.ok) return setError(r.error);
      toast.success("கடவுச்சொல் மாற்றப்பட்டது (Password updated)");
      await router.invalidate();
      await navigate({ to: me.role === "admin" ? "/admin" : "/member" });
    } catch {
      setError("பிழை ஏற்பட்டது (Something went wrong)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-hero px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-lift">
        <LockKeyhole className="size-8 text-primary" />
        <h1 className="mt-3 text-xl font-bold">புதிய கடவுச்சொல் அமைக்கவும்</h1>
        <p className="text-xs text-muted-foreground">
          {me.mustChange ? "First login — you must change your temporary password to continue." : "Change your password"} · {me.fullName}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">தற்போதைய கடவுச்சொல் (Current password)</span>
            <Input name="current" type="password" required autoComplete="current-password" className="h-11" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">புதிய கடவுச்சொல் (New password)</span>
            <Input value={pw} onChange={(e) => setPw(e.target.value)} type="password" required autoComplete="new-password" className="h-11" />
          </label>
          <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            {rules.map((r) => {
              const ok = r.test(pw);
              return (
                <li key={r.label} className={ok ? "flex items-center gap-1 text-success" : "flex items-center gap-1 text-muted-foreground"}>
                  {ok ? <Check className="size-3" /> : <X className="size-3" />} {r.label}
                </li>
              );
            })}
          </ul>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">மீண்டும் உள்ளிடவும் (Confirm)</span>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required autoComplete="new-password" className="h-11" />
          </label>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full" disabled={loading || !rules.every((r) => r.test(pw))}>
            {loading && <Loader2 className="size-4 animate-spin" />} சேமி (Save)
          </Button>
        </form>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/", replace: true }); }}
          className="mt-4 text-sm text-muted-foreground hover:text-destructive"
        >
          வெளியேறு (Sign out)
        </button>
      </div>
    </main>
  );
}
