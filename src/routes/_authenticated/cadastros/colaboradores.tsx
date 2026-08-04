import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createColaborador, deleteColaborador, listColaboradores } from "@/lib/catalogos.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/cadastros/colaboradores")({
  head: () => ({ meta: [{ title: "Colaboradores | Cadastros" }] }),
  component: Colaboradores,
});

function Colaboradores() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["colaboradores"], queryFn: listColaboradores });
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");

  const criar = useMutation({
    mutationFn: createColaborador,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      setNome("");
      setFuncao("");
    },
    onError: () => toast.error("Não foi possível adicionar."),
  });

  const remover = useMutation({
    mutationFn: deleteColaborador,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colaboradores"] }),
    onError: () => toast.error("Não foi possível remover."),
  });

  return (
    <section className="panel space-y-3 p-4">
      {(data ?? []).map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between gap-3 rounded-md bg-secondary/40 px-3 py-2"
        >
          <span className="text-sm font-medium">
            {c.nome}
            {c.funcao && <span className="ml-2 text-xs text-muted-foreground">{c.funcao}</span>}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remover.mutate({ data: c.id })}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" /> Remover
          </Button>
        </div>
      ))}
      {!data?.length && (
        <p className="text-sm text-muted-foreground">Nenhum colaborador cadastrado.</p>
      )}
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nome.trim()) return;
          criar.mutate({ data: { nome: nome.trim(), funcao: funcao.trim() } });
        }}
      >
        <Input
          className="flex-1"
          placeholder="Nome do colaborador"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Input
          className="w-48"
          placeholder="Função (ex.: Operador)"
          value={funcao}
          onChange={(e) => setFuncao(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          <Plus className="size-4" /> Adicionar
        </Button>
      </form>
    </section>
  );
}
