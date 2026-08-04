import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FilePlus2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listReports } from "@/lib/reports.functions";
import {
  TURNOS,
  formatarData,
  formatarNumero,
  pendenciasAbertas,
  tempoParado,
  totalMeta,
  totalProduzido,
  type Turno,
} from "@/lib/shift";

export const Route = createFileRoute("/_authenticated/relatorios/")({
  head: () => ({
    meta: [
      { title: "Relatórios de turno | Passagem de Turno" },
      {
        name: "description",
        content: "Histórico de relatórios de passagem de turno com produção, paradas e pendências.",
      },
      { property: "og:title", content: "Relatórios de turno" },
      {
        property: "og:description",
        content: "Histórico completo das passagens de turno registradas pela equipe.",
      },
    ],
  }),
  component: Lista,
});

const CORES: Record<Turno, string> = {
  A: "var(--turno-a)",
  B: "var(--turno-b)",
  C: "var(--turno-c)",
};

function Lista() {
  const { data, isLoading } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const [busca, setBusca] = useState("");

  const reports = (data ?? []).filter((r) => {
    const alvo = `${r.data} ${r.turno} ${r.responsavel} ${r.setor} ${r.resumo}`.toLowerCase();
    return alvo.includes(busca.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Histórico de passagens de turno.</p>
        </div>
        <Button asChild>
          <Link to="/relatorios/novo">
            <FilePlus2 className="size-4" /> Novo relatório
          </Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por data, turno, responsável ou setor"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-muted-foreground">Nenhum relatório encontrado.</p>
          <Button asChild className="mt-4">
            <Link to="/relatorios/novo">Criar o primeiro relatório</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                to="/relatorios/$id"
                params={{ id: r.id }}
                className="panel flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-primary"
              >
                <span
                  className="flex size-11 items-center justify-center rounded-md font-display text-lg font-semibold"
                  style={{ backgroundColor: CORES[r.turno], color: "#1b2230" }}
                >
                  {r.turno}
                </span>
                <div className="min-w-[180px] flex-1">
                  <div className="font-semibold">
                    {formatarData(r.data)} — {TURNOS[r.turno].inicio} às {TURNOS[r.turno].fim}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.responsavel || "Sem responsável"}
                    {r.setor ? ` · ${r.setor}` : ""}
                  </div>
                </div>
                <Info label="Produção" valor={`${formatarNumero(totalProduzido(r))}`} />
                <Info label="Meta" valor={`${formatarNumero(totalMeta(r))}`} />
                <Info label="Paradas" valor={`${r.paradas.length} · ${tempoParado(r)} min`} />
                <Info label="Pendências" valor={`${pendenciasAbertas(r).length}`} />
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    r.status === "finalizado"
                      ? "bg-success/20 text-success"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  {r.status === "finalizado" ? "Finalizado" : "Rascunho"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="min-w-20">
      <div className="label-industrial">{label}</div>
      <div className="text-sm font-medium">{valor}</div>
    </div>
  );
}
