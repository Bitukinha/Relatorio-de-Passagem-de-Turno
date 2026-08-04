import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ReportForm } from "@/components/ReportForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteReport, getReport, updateReport } from "@/lib/reports.functions";
import { listColaboradores, listEquipamentos, listSupervisores } from "@/lib/catalogos.functions";
import { gerarPdf } from "@/lib/pdf";
import { emptyReport, formatarData, type ShiftReportInput } from "@/lib/shift";

export const Route = createFileRoute("/_authenticated/relatorios/$id")({
  head: () => ({
    meta: [
      { title: "Relatório de turno | Passagem de Turno" },
      {
        name: "description",
        content: "Consulte, edite e exporte em PDF um relatório de passagem de turno.",
      },
      { property: "og:title", content: "Relatório de turno" },
      {
        property: "og:description",
        content: "Detalhe do relatório de passagem de turno com exportação em PDF.",
      },
    ],
  }),
  component: Detalhe,
});

function Detalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: () => getReport({ data: id }),
  });

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

  useEffect(() => {
    if (data) {
      const { id: _id, criado_por: _u, created_at: _c, updated_at: _up, ...rest } = data;
      setValor(rest as ShiftReportInput);
    }
  }, [data]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) {
    return (
      <div className="panel p-10 text-center text-muted-foreground">Relatório não encontrado.</div>
    );
  }

  async function salvar(status: "rascunho" | "finalizado") {
    setSalvando(true);
    try {
      await updateReport({ data: { id, report: { ...valor, status } } });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      await qc.invalidateQueries({ queryKey: ["report", id] });
      toast.success("Relatório atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o relatório.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    try {
      await deleteReport({ data: id });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Relatório excluído.");
      navigate({ to: "/relatorios" });
    } catch {
      toast.error("Não foi possível excluir.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase">
            Turno {data.turno} — {formatarData(data.data)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.responsavel || "Sem responsável"}
            {data.setor ? ` · ${data.setor}` : ""}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <Trash2 className="size-4" /> Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir este relatório?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O relatório será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ReportForm
        valor={valor}
        onChange={setValor}
        onSalvar={salvar}
        salvando={salvando}
        onPdf={() => gerarPdf({ ...data, ...valor })}
        supervisores={supervisores ?? []}
        colaboradores={colaboradores ?? []}
        equipamentos={equipamentos ?? []}
      />
    </div>
  );
}
