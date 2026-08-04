import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileDown, BarChart3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ESCALA, TURNOS } from "@/lib/shift";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Relatório de Passagem de Turno | Indicadores e PDF" },
      {
        name: "description",
        content:
          "Registre a passagem de turno A, B e C da fábrica, gere o relatório em PDF e acompanhe indicadores de produção, paradas e pendências.",
      },
      { property: "og:title", content: "Relatório de Passagem de Turno" },
      {
        property: "og:description",
        content:
          "Registro digital da passagem de turno industrial, com geração de PDF e painel de indicadores.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-display text-lg font-semibold uppercase tracking-wide">
            Passagem de Turno
          </span>
          <Button asChild size="sm">
            <Link to="/painel">Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="py-16">
          <p className="label-industrial">{ESCALA}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold uppercase leading-tight sm:text-5xl">
            Relatório de passagem de turno da produção
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Um único lugar para registrar como o turno rodou, anomalias, produção, qualidade,
            manutenção, segurança e pendências — com PDF pronto para assinatura e indicadores
            comparando os turnos A, B e C.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/painel">Começar agora</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-3">
          {(Object.keys(TURNOS) as Array<keyof typeof TURNOS>).map((t) => (
            <div key={t} className="panel p-5">
              <span
                className="inline-flex size-9 items-center justify-center rounded-md font-display text-lg font-semibold"
                style={{ backgroundColor: `var(--turno-${t.toLowerCase()})`, color: "#1b2230" }}
              >
                {t}
              </span>
              <h2 className="mt-3 text-xl font-semibold">{TURNOS[t].nome}</h2>
              <p className="text-sm text-muted-foreground">
                {TURNOS[t].inicio} às {TURNOS[t].fim}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-3">
          {[
            {
              icon: ClipboardList,
              titulo: "Formulário completo",
              texto:
                "12 blocos: resumo, produção, máquinas, paradas, qualidade, estoque, manutenção, segurança, 5S, pendências e aprovações.",
            },
            {
              icon: FileDown,
              titulo: "PDF em um clique",
              texto:
                "Relatório formatado com tabelas de produção e paradas, pronto para imprimir e assinar.",
            },
            {
              icon: BarChart3,
              titulo: "Indicadores",
              texto:
                "Produção x meta por turno, anomalias e tempo parado, e pendências ainda em aberto.",
            },
          ].map((c) => (
            <div key={c.titulo} className="panel p-5">
              <c.icon className="size-6 text-primary" />
              <h2 className="mt-3 text-xl font-semibold">{c.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.texto}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" />
          Acesso restrito à equipe da fábrica.
        </div>
      </footer>
    </div>
  );
}
