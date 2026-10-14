import { createFileRoute, redirect } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/member")({
  head: () => ({ meta: [{ title: "உறுப்பினர் முகப்பு — அறம் வழிக் குழு" }] }),
  beforeLoad: ({ context }) => {
    if (context.me.mustChange) throw redirect({ to: "/change-password" });
  },
  component: MemberHome,
});

function MemberHome() {
  const { me } = Route.useRouteContext();
  return (
    <AppShell me={me} title="உறுப்பினர் முகப்பு" nav={[{ to: "/member", ta: "முகப்பு", en: "Home", icon: LayoutDashboard, exact: true }]}>
      <PageHeader ta={`வணக்கம், ${me.fullName}`} en={`Member Dashboard · ${me.memberCode}`} />
      <p className="text-sm text-muted-foreground">உங்கள் நிதி விவரங்கள் விரைவில் இங்கே காட்டப்படும். (Your records will appear here.)</p>
    </AppShell>
  );
}
