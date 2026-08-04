import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { login, listUsuariosAtivos, type Papel, type Usuario } from "@/lib/auth.functions";
import { Skeleton } from "@/components/ui/skeleton";
import logoUrl from "@/assets/nutrimilho-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar | Passagem de Turno" }],
  }),
  component: LoginPage,
});

const PAPEL_LABEL: Record<Papel, string> = {
  turno_a: "Turno A",
  turno_b: "Turno B",
  turno_c: "Turno C",
  admin: "Administrador",
};

function LoginPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["usuarios-ativos"],
    queryFn: listUsuariosAtivos,
  });
  const [entrando, setEntrando] = useState<string | null>(null);

  async function entrar(usuario: Usuario) {
    setEntrando(usuario.id);
    try {
      await login({ data: { usuarioId: usuario.id } });
      await router.invalidate();
      navigate({ to: "/painel" });
    } catch {
      toast.error("Não foi possível entrar. Tente novamente.");
    } finally {
      setEntrando(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <img src={logoUrl} alt="Nutrimilho" className="h-10 w-auto" />
        </div>

        <div className="panel p-6">
          <h1 className="text-center font-display text-lg font-semibold uppercase tracking-wide">
            Quem está acessando?
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Toque no seu nome para entrar.
          </p>

          <div className="mt-6 space-y-2">
            {isLoading && (
              <>
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </>
            )}
            {data?.map((usuario) => (
              <button
                key={usuario.id}
                type="button"
                disabled={entrando !== null}
                onClick={() => entrar(usuario)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/40 px-4 py-3 text-left transition-colors hover:border-primary hover:bg-secondary disabled:opacity-60"
              >
                <span className="font-medium">{usuario.nome}</span>
                <span className="label-industrial">{PAPEL_LABEL[usuario.papel]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
