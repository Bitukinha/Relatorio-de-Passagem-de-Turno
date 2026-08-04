import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ReportForm } from "@/components/ReportForm";
import { createReport } from "@/lib/reports.functions";
import { listColaboradores, listEquipamentos, listSupervisores } from "@/lib/catalogos.functions";
import { emptyReport, type ShiftReportInput } from "@/lib/shift";

export const Route = createFileRoute("/_authenticated/relatorios/novo")({
  head: () => ({
    meta: [
      { title: "Novo relatório de turno | Passagem de Turno" },
      {
        name: "description",
        content:
          "Preencha a passagem de turno: produção, paradas, qualidade, segurança e pendências.",
      },
      { property: "og:title", content: "Novo relatório de turno" },
      {
        property: "og:description",
        content: "Formulário completo de passagem de turno da produção.",
      },
    ],
  }),
  component: Novo,
});

function Novo() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [valor, setValor] = useState<ShiftReportInput>(emptyReport());
  const [salvando, setSalvando] = useState(false);
  const { data: supervisores } = useQuery({
    queryKey: ["supervisores"],
    queryFn: listSupervisores,
  });
  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: listColaboradores,
  });
  const { data: equipamentos } = useQuery({
    queryKey: ["equipamentos"],
    queryFn: listEquipamentos,
  });

  async function salvar(status: "rascunho" | "finalizado") {
    if (!valor.responsavel.trim()) {
      toast.error("Informe o responsável pelo turno.");
      return;
    }
    setSalvando(true);
    try {
      const criado = await createReport({ data: { ...valor, status } });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Relatório salvo.");
      navigate({ to: "/relatorios/$id", params: { id: criado.id } });
    } catch {
      toast.error("Não foi possível salvar o relatório.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold uppercase">Novo relatório</h1>
        <p className="text-sm text-muted-foreground">
          Registre como o turno rodou e o que fica para o próximo.
        </p>
      </div>
      <ReportForm
        valor={valor}
        onChange={setValor}
        onSalvar={salvar}
        salvando={salvando}
        supervisores={supervisores ?? []}
        colaboradores={colaboradores ?? []}
        equipamentos={equipamentos ?? []}
      />
    </div>
  );
}
