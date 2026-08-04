import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getSession();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: AppShell,
});
