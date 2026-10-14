import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ ta, en, actions }: { ta: string; en?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{ta}</h1>
        {en && <p className="mt-1 text-sm text-muted-foreground">{en}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, ta, en, value, tone = "primary" }: { icon: LucideIcon; ta: string; en: string; value: ReactNode; tone?: "primary" | "gold" | "danger" }) {
  return (
    <div className="animate-rise rounded-xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{ta}</p>
          <p className="text-xs text-muted-foreground">{en}</p>
        </div>
        <span
          className={cn(
            "grid size-10 place-items-center rounded-lg",
            tone === "primary" && "bg-secondary text-primary",
            tone === "gold" && "bg-gold/15 text-warning-foreground",
            tone === "danger" && "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function Panel({ title, sub, children, actions, className }: { title?: string; sub?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-soft", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusPill({ tone, children }: { tone: "success" | "warning" | "muted" | "danger"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "success" && "bg-success/15 text-success",
        tone === "warning" && "bg-warning/25 text-warning-foreground",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "danger" && "bg-destructive/10 text-destructive",
      )}
    >
      {children}
    </span>
  );
}

export function DataTable({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-3 [&_td]:py-2.5 [&_tr]:border-b [&_tr:last-child]:border-0">{children}</tbody>
      </table>
      {empty && <p className="py-8 text-center text-sm text-muted-foreground">பதிவுகள் இல்லை (No records)</p>}
    </div>
  );
}

export function Th({ ta, en }: { ta: string; en: string }) {
  return (
    <span className="flex flex-col leading-tight">
      <span>{ta}</span>
      <span className="text-[10px] font-normal opacity-70">{en}</span>
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Loading() {
  return <div className="py-16 text-center text-sm text-muted-foreground">ஏற்றுகிறது… (Loading)</div>;
}
