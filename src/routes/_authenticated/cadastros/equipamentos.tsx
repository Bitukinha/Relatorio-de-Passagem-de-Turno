import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createEquipamento, deleteEquipamento, listEquipamentos } from "@/lib/catalogos.functions";
import { SETORES_MAQUINAS } from "@/lib/shift";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/cadastros/equipamentos")({
  head: () => ({ meta: [{ title: "Equipamentos | Cadastros" }] }),
  component: Equipamentos,
});

function Equipamentos() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["equipamentos"], queryFn: listEquipamentos });
  const [novoNome, setNovoNome] = useState<Record<string, string>>({});

  const criar = useMutation({
    mutationFn: createEquipamento,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipamentos"] }),
    onError: () => toast.error("Não foi possível adicionar."),
  });

  const remover = useMutation({
    mutationFn: deleteEquipamento,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipamentos"] }),
    onError: () => toast.error("Não foi possível remover."),
  });

  return (
    <div className="space-y-4">
      {SETORES_MAQUINAS.map((setor) => {
        const itens = (data ?? []).filter((e) => e.setor === setor);
        const nome = novoNome[setor] ?? "";
        return (
          <section key={setor} className="overflow-hidden rounded-lg border border-success/40">
            <header className="flex items-center gap-3 border-b border-success/40 bg-success/10 px-4 py-2.5">
              <span className="h-6 w-1.5 rounded bg-success" />
              <span className="flex-1 text-sm font-bold uppercase tracking-wide">{setor}</span>
            </header>
            <div className="space-y-2 p-3">
              {itens.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-secondary/40 px-3 py-2"
                >
                  <span className="text-sm font-medium">{e.nome}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remover.mutate({ data: e.id })}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" /> Remover
                  </Button>
                </div>
              ))}
              {!itens.length && (
                <p className="text-sm text-muted-foreground">Nenhum equipamento cadastrado.</p>
              )}
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!nome.trim()) return;
                  criar.mutate(
                    { data: { setor, nome: nome.trim() } },
                    { onSuccess: () => setNovoNome((prev) => ({ ...prev, [setor]: "" })) },
                  );
                }}
              >
                <Input
                  placeholder="Nome do equipamento"
                  value={nome}
                  onChange={(e) => setNovoNome((prev) => ({ ...prev, [setor]: e.target.value }))}
                />
                <Button type="submit" variant="secondary">
                  <Plus className="size-4" /> Adicionar
                </Button>
              </form>
            </div>
          </section>
        );
      })}
    </div>
  );
}
