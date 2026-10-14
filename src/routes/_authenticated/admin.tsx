import { createFileRoute, redirect } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "நிர்வாகி முகப்பு — அறம் வழிக் குழு" }] }),
  beforeLoad: ({ context }) => {
    if (context.me.mustChange) throw redirect({ to: "/change-password" });
    if (context.me.role !== "admin") throw redirect({ to: "/member" });
  },
  component: AdminHome,
});

function AdminHome() {
  const { me } = Route.useRouteContext();
  return (
    <AppShell me={me} title="நிர்வாகி முகப்பு" nav={[{ to: "/admin", ta: "முகப்பு", en: "Home", icon: LayoutDashboard, exact: true }]}>
      <PageHeader ta="நிர்வாகி முகப்பு" en={`Admin Dashboard · ${me.fullName}`} />
      <p className="text-sm text-muted-foreground">நிர்வாகப் பக்கங்கள் விரைவில் சேர்க்கப்படும். (Admin pages coming next.)</p>
    </AppShell>
  );
}
