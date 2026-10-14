import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import logo from "@/assets/avk-logo.png";
import { signOut, type Me } from "@/lib/session";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; ta: string; en: string; icon: LucideIcon; exact?: boolean };

export function AppShell({ me, nav, title, children }: { me: Me; nav: NavItem[]; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src={logo} alt="" width={816} height={816} className="size-10 rounded-full bg-card p-0.5" />
        <div className="leading-tight">
          <p className="font-display font-bold">அறம் வழிக் குழு</p>
          <p className="text-xs opacity-70">{title}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.exact ?? false }}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-semibold" }}
          >
            <n.icon className="size-4 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span>{n.ta}</span>
              <span className="text-[10px] opacity-60">{n.en}</span>
            </span>
          </Link>
        ))}
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-sidebar-accent">
          <LogOut className="size-4" />
          <span className="flex flex-col items-start leading-tight">
            <span>வெளியேறு</span>
            <span className="text-[10px] opacity-60">Logout</span>
          </span>
        </button>
      </nav>
      <div className="border-t border-sidebar-border px-5 py-4 text-xs">
        <p className="font-semibold">{me.fullName}</p>
        <p className="opacity-70">{me.memberCode} · {me.role === "admin" ? "நிர்வாகி (Admin)" : "உறுப்பினர் (Member)"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" width={816} height={816} className="size-8" />
          <span className="font-display font-bold text-primary">அறம் வழிக் குழு</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="பட்டியல் (Menu)" className="rounded-md p-2 hover:bg-muted">
          <Menu className="size-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className={cn("absolute inset-y-0 left-0 w-72 shadow-lift")}>
            <button onClick={() => setOpen(false)} aria-label="மூடு" className="absolute right-2 top-2 z-10 rounded p-2 text-sidebar-foreground">
              <X className="size-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}
      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
