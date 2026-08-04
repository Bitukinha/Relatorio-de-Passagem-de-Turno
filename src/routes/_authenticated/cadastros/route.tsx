import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cadastros")({
  beforeLoad: ({ context }) => {
    if (context.user.papel !== "admin") throw redirect({ to: "/painel" });
  },
  component: CadastrosLayout,
});

const TABS = [
  { to: "/cadastros/equipamentos", label: "Equipamentos" },
  { to: "/cadastros/supervisores", label: "Supervisores" },
  { to: "/cadastros/colaboradores", label: "Colaboradores" },
] as const;

function CadastrosLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold uppercase">Cadastros</h1>
        <p className="text-sm text-muted-foreground">
          Equipamentos, supervisores e colaboradores usados nos relatórios.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === tab.to
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
