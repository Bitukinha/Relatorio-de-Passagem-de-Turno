import {
  getRouteApi,
  Link,
  Outlet,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, ClipboardList, FilePlus2, LogOut, Settings2 } from "lucide-react";
import { ESCALA } from "@/lib/shift";
import { logout } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import logoUrl from "@/assets/nutrimilho-logo.png";

const NAV = [
  { to: "/painel", label: "Indicadores", icon: BarChart3 },
  { to: "/relatorios", label: "Relatórios", icon: ClipboardList },
  { to: "/relatorios/novo", label: "Novo relatório", icon: FilePlus2 },
] as const;

const routeApi = getRouteApi("/_authenticated");

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = routeApi.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function sair() {
    await logout();
    qc.clear();
    await router.invalidate();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/painel" className="flex items-center gap-3">
            <img src={logoUrl} alt="Nutrimilho" className="h-9 w-auto" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-lg font-semibold uppercase tracking-wide text-primary">
                Passagem de Turno
              </span>
              <span className="block text-[11px] text-muted-foreground">{ESCALA}</span>
            </span>
          </Link>

          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV.map((item) => {
              const ativo =
                item.to === "/relatorios"
                  ? pathname === "/relatorios"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            {user.papel === "admin" && (
              <Link
                to="/cadastros/supervisores"
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/cadastros")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Settings2 className="size-4" />
                Cadastros
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-medium">{user.nome}</span>
              <span className="label-industrial">
                {user.papel === "admin" ? "Administrador" : "Turno"}
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={sair}>
              <LogOut className="size-4" />
              Trocar usuário
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground">
          © 2026 Nutrimilho (Novaes Tech) | Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
