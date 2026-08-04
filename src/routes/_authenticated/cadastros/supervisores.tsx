import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createSupervisor, deleteSupervisor, listSupervisores } from "@/lib/catalogos.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/cadastros/supervisores")({
  head: () => ({ meta: [{ title: "Supervisores | Cadastros" }] }),
  component: Supervisores,
});

function Supervisores() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["supervisores"], queryFn: listSupervisores });
  const [nome, setNome] = useState("");

  const criar = useMutation({
    mutationFn: createSupervisor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supervisores"] });
      setNome("");
    },
    onError: () => toast.error("Não foi possível adicionar."),
  });

  const remover = useMutation({
    mutationFn: deleteSupervisor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supervisores"] }),
    onError: () => toast.error("Não foi possível remover."),
  });

  return (
    <section className="panel space-y-3 p-4">
      {(data ?? []).map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-md bg-secondary/40 px-3 py-2"
        >
          <span className="text-sm font-medium">{s.nome}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remover.mutate({ data: s.id })}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" /> Remover
          </Button>
        </div>
      ))}
      {!data?.length && (
        <p className="text-sm text-muted-foreground">Nenhum supervisor cadastrado.</p>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nome.trim()) return;
          criar.mutate({ data: { nome: nome.trim() } });
        }}
      >
        <Input
          placeholder="Nome do supervisor"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          <Plus className="size-4" /> Adicionar
        </Button>
      </form>
    </section>
  );
}
