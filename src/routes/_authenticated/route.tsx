import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe, signOut } from "@/lib/session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const me = await getMe();
    if (!me) throw redirect({ to: "/" });
    if (me.status !== "active") {
      await signOut();
      throw redirect({ to: "/member-login" });
    }
    return { me };
  },
  component: () => <Outlet />,
});
