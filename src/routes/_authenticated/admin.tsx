import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ADMIN_NAV } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{"title": "நிர்வாகி — அறம் வழிக் குழு"}, {"name": "description", "content": "அறம் வழிக் குழுவின் பாதுகாப்பான நிர்வாகப் பகுதி."}, {"property": "og:title", "content": "நிர்வாகி — அறம் வழிக் குழு"}, {"property": "og:description", "content": "அறம் வழிக் குழுவின் பாதுகாப்பான நிர்வாகப் பகுதி."}, {"property": "og:type", "content": "website"}, {"name": "twitter:card", "content": "summary"}] }),
  beforeLoad: ({ context }) => {
    if (context.me.mustChange) throw redirect({ to: "/change-password" });
    if (context.me.role !== "admin") throw redirect({ to: "/member" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { me } = Route.useRouteContext();
  return (
    <AppShell me={me} title="நிர்வாகி (Admin)" nav={ADMIN_NAV}>
      <Outlet />
    </AppShell>
  );
}
