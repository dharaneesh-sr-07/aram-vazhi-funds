import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import logoAsset from "@/assets/avk-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithUsername } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";

const MESSAGES = {
  invalid: "பயனர்பெயர் அல்லது கடவுச்சொல் தவறு (Invalid username or password)",
  inactive: "உங்கள் கணக்கு செயலிழக்கப்பட்டுள்ளது. நிர்வாகியை தொடர்பு கொள்ளவும். (Account inactive)",
  not_admin: "இந்தக் கணக்கிற்கு நிர்வாகி அனுமதி இல்லை. உறுப்பினர் உள்நுழைவைப் பயன்படுத்தவும். (Not an admin account)",
  error: "பிழை ஏற்பட்டது, மீண்டும் முயற்சிக்கவும் (Something went wrong)",
};

export function LoginForm({ portal }: { portal: "admin" | "member" }) {
  const navigate = useNavigate();
  const login = useServerFn(loginWithUsername);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const res = await login({ data: { username: String(fd.get("username")), password: String(fd.get("password")), portal } });
      if (!res.ok) {
        setError(MESSAGES[res.reason]);
        return;
      }
      await supabase.auth.setSession({ access_token: res.access_token, refresh_token: res.refresh_token });
      if (res.mustChange) {
        setNotice("முதல் உள்நுழைவு: புதிய கடவுச்சொல் அமைக்கவும் (Password change required)");
        await navigate({ to: "/change-password" });
      } else {
        await navigate({ to: res.role === "admin" ? "/admin" : "/member" });
      }
    } catch {
      setError(MESSAGES.error);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = portal === "admin";
  return (
    <main className="grid min-h-screen place-items-center bg-hero px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> முகப்பு (Home)
        </Link>
        <div className="animate-rise rounded-2xl border bg-card p-7 shadow-lift">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="" width={1302} height={1302} className="size-12" />
            <div>
              <h1 className="text-xl font-bold text-primary">{isAdmin ? "நிர்வாகி உள்நுழைவு" : "உறுப்பினர் உள்நுழைவு"}</h1>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Admin Login" : "Member Login"} · அறம் வழிக் குழு</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">பயனர்பெயர் (Username)</span>
              <Input name="username" required autoComplete="username" autoCapitalize="none" className="h-11" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">கடவுச்சொல் (Password)</span>
              <div className="relative">
                <Input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="h-11 pr-11" />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "கடவுச்சொல்லை மறை" : "கடவுச்சொல்லைக் காட்டு"}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-primary"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            {error && (
              <p role="alert" className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}
            {notice && <p className="rounded-lg bg-warning/25 p-3 text-sm text-warning-foreground">{notice}</p>}
            <Button type="submit" disabled={loading} className="h-11 w-full text-base">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? "சரிபார்க்கிறது…" : "உள்நுழை (Login)"}
            </Button>
          </form>
          <div className="mt-5 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">கடவுச்சொல் மறந்துவிட்டதா? (Forgot password)</Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {isAdmin ? "உறுப்பினரா? " : "நிர்வாகியா? "}
            <Link to={isAdmin ? "/member-login" : "/admin-login"} className="font-medium text-primary hover:underline">
              {isAdmin ? "உறுப்பினர் உள்நுழைவு" : "நிர்வாகி உள்நுழைவு"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
