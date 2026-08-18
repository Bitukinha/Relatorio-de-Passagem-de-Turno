import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Clock, Factory, ListTodo } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Indicadores dos turnos | Passagem de Turno" },
      {
        name: "description",
        content:
          "Painel com produção x meta por turno, anomalias, tempo parado e pendências em aberto.",
      },
      { property: "og:title", content: "Indicadores dos turnos" },
      {
        property: "og:description",
        content: "Produção x meta, paradas e pendências em aberto dos turnos A, B e C.",
      },
    ],
  }),
  component: Painel,
});

const CORES: Record<Turno, string> = {
  A: "var(--turno-a)",
  B: "var(--turno-b)",
  C: "var(--turno-c)",
};

function Painel() {
  const { data, isLoading } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const reports = data ?? [];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const porTurno = (Object.keys(TURNOS) as Turno[]).map((t) => {
    const rs = reports.filter((r) => r.turno === t);
    return {
      turno: t,
      Produzido: rs.reduce((s, r) => s + totalProduzido(r), 0),
      Meta: rs.reduce((s, r) => s + totalMeta(r), 0),
      paradas: rs.reduce((s, r) => s + r.paradas.length, 0),
      minutos: rs.reduce((s, r) => s + tempoParado(r), 0),
      relatorios: rs.length,
    };
  });

  const produzidoTotal = porTurno.reduce((s, t) => s + t.Produzido, 0);
  const metaTotal = porTurno.reduce((s, t) => s + t.Meta, 0);
  const atingimento = metaTotal > 0 ? (produzidoTotal / metaTotal) * 100 : 0;
  const totalParadas = porTurno.reduce((s, t) => s + t.paradas, 0);
  const minutosParados = porTurno.reduce((s, t) => s + t.minutos, 0);

  const abertas = reports.flatMap((r) =>
    pendenciasAbertas(r).map((p) => ({ report: r, descricao: p.descricao })),
  );

  const motivos = new Map<string, number>();
  reports.forEach((r) =>
    r.paradas.forEach((p) => {
      const chave = (p.motivo || "Não informado").trim();
      motivos.set(chave, (motivos.get(chave) ?? 0) + (p.tempo || 0));
    }),
  );
  const topMotivos = [...motivos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-8">
      {abertas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>
            {abertas.length} pendência{abertas.length > 1 ? "s" : ""} deixada
            {abertas.length > 1 ? "s" : ""} para o próximo turno
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1.5">
              {abertas.slice(0, 5).map((p, i) => (
                <li key={i}>
                  <Link
                    to="/relatorios/$id"
                    params={{ id: p.report.id }}
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {p.descricao || "(sem descrição)"}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    — turno {p.report.turno}, {formatarData(p.report.data)}
                  </span>
                </li>
              ))}
            </ul>
            {abertas.length > 5 && (
              <p className="mt-2 text-xs text-muted-foreground">
                +{abertas.length - 5} outra(s) pendência(s) na lista completa abaixo.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-3xl font-bold uppercase">Indicadores</h1>
        <p className="text-sm text-muted-foreground">
          Consolidado de {reports.length} relatório(s) registrado(s).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          icon={Factory}
          label="Produção x meta"
          valor={`${formatarNumero(atingimento, 1)}%`}
          detalhe={`${formatarNumero(produzidoTotal)} de ${formatarNumero(metaTotal)}`}
        />
        <Kpi
          icon={AlertTriangle}
          label="Anomalias / paradas"
          valor={formatarNumero(totalParadas)}
          detalhe="ocorrências registradas"
        />
        <Kpi
          icon={Clock}
          label="Tempo parado"
          valor={`${formatarNumero(minutosParados)} min`}
          detalhe={`${formatarNumero(minutosParados / 60, 1)} h acumuladas`}
        />
        <Kpi
          icon={ListTodo}
          label="Pendências em aberto"
          valor={formatarNumero(abertas.length)}
          detalhe="aguardando o próximo turno"
        />
      </div>

      <section className="panel p-5">
        <h2 className="mb-4 text-xl font-semibold uppercase">Produção x meta por turno</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porTurno}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="turno" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                }}
              />
              <Legend />
              <Bar dataKey="Meta" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Produzido" radius={[4, 4, 0, 0]}>
                {porTurno.map((t) => (
                  <Cell key={t.turno} fill={CORES[t.turno]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 text-xl font-semibold uppercase">Tempo parado por motivo</h2>
          {topMotivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma parada registrada ainda.</p>
          ) : (
            <ul className="space-y-3">
              {topMotivos.map(([motivo, min]) => {
                const max = topMotivos[0]![1] || 1;
                return (
                  <li key={motivo}>
                    <div className="flex justify-between text-sm">
                      <span>{motivo}</span>
                      <span className="text-muted-foreground">{formatarNumero(min)} min</span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-secondary">
                      <div
                        className="h-2 rounded bg-primary"
                        style={{ width: `${(min / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 text-xl font-semibold uppercase">Pendências em aberto</h2>
          {abertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma pendência em aberto.</p>
          ) : (
            <ul className="space-y-2">
              {abertas.slice(0, 12).map((p, i) => (
                <li key={i} className="rounded-md bg-secondary/40 p-3 text-sm">
                  <Link
                    to="/relatorios/$id"
                    params={{ id: p.report.id }}
                    className="font-medium hover:text-primary"
                  >
                    {p.descricao || "(sem descrição)"}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    Turno {p.report.turno} — {formatarData(p.report.data)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="mb-4 text-xl font-semibold uppercase">Resumo por turno</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {porTurno.map((t) => (
            <div key={t.turno} className="rounded-md bg-secondary/40 p-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded font-display font-semibold"
                  style={{ backgroundColor: CORES[t.turno], color: "#1b2230" }}
                >
                  {t.turno}
                </span>
                <span className="text-sm text-muted-foreground">
                  {TURNOS[t.turno].inicio} às {TURNOS[t.turno].fim}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <Linha label="Relatórios" valor={formatarNumero(t.relatorios)} />
                <Linha label="Produzido" valor={formatarNumero(t.Produzido)} />
                <Linha label="Meta" valor={formatarNumero(t.Meta)} />
                <Linha
                  label="Atingimento"
                  valor={`${formatarNumero(t.Meta > 0 ? (t.Produzido / t.Meta) * 100 : 0, 1)}%`}
                />
                <Linha label="Paradas" valor={`${t.paradas} (${formatarNumero(t.minutos)} min)`} />
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  valor,
  detalhe,
}: {
  icon: typeof Factory;
  label: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 label-industrial">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{valor}</div>
      <div className="text-xs text-muted-foreground">{detalhe}</div>
    </div>
  );
}
