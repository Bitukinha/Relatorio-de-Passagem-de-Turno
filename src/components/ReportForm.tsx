import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, FileDown, X } from "lucide-react";
import {
  TURNOS,
  type EquipamentoItem,
  type ParadaItem,
  type PendenciaItem,
  type ProducaoItem,
  type ShiftReportInput,
  type SiloItem,
  type Turno,
} from "@/lib/shift";
import type { Colaborador, Supervisor } from "@/lib/catalogos.functions";

function Secao({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold uppercase">
        <span className="flex size-7 items-center justify-center rounded bg-primary text-sm text-primary-foreground">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Campo({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="label-industrial">{label}</Label>
      {children}
    </div>
  );
}

type Props = {
  valor: ShiftReportInput;
  onChange: (v: ShiftReportInput) => void;
  onSalvar: (status: "rascunho" | "finalizado") => void;
  onPdf?: () => void;
  salvando?: boolean;
  supervisores: Supervisor[];
  colaboradores: Colaborador[];
};

export function ReportForm({
  valor,
  onChange,
  onSalvar,
  onPdf,
  salvando,
  supervisores,
  colaboradores,
}: Props) {
  const [f, setF] = useState(valor);

  useEffect(() => {
    setF(valor);
  }, [valor]);

  function set<K extends keyof ShiftReportInput>(key: K, v: ShiftReportInput[K]) {
    const novo = { ...f, [key]: v };
    setF(novo);
    onChange(novo);
  }

  function setTurno(t: Turno) {
    const novo = { ...f, turno: t, hora_inicio: TURNOS[t].inicio, hora_fim: TURNOS[t].fim };
    setF(novo);
    onChange(novo);
  }

  function updateSiloItem(gIdx: number, iIdx: number, patch: Partial<SiloItem>) {
    const grupo = f.silos[gIdx];
    if (!grupo) return;
    set("silos", edit(f.silos, gIdx, { itens: edit(grupo.itens, iIdx, patch) }));
  }

  function updateEquipamentoItem(gIdx: number, iIdx: number, patch: Partial<EquipamentoItem>) {
    const grupo = f.equipamentos[gIdx];
    if (!grupo) return;
    set("equipamentos", edit(f.equipamentos, gIdx, { itens: edit(grupo.itens, iIdx, patch) }));
  }

  return (
    <div className="space-y-6">
      <Secao numero="1" titulo="Identificação">
        <div className="grid gap-4 md:grid-cols-3">
          <Campo label="Data">
            <Input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} />
          </Campo>
          <Campo label="Turno">
            <Select value={f.turno} onValueChange={(v) => setTurno(v as Turno)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TURNOS) as Turno[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TURNOS[t].nome} — {TURNOS[t].inicio} às {TURNOS[t].fim}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Início">
              <Input value={f.hora_inicio} onChange={(e) => set("hora_inicio", e.target.value)} />
            </Campo>
            <Campo label="Término">
              <Input value={f.hora_fim} onChange={(e) => set("hora_fim", e.target.value)} />
            </Campo>
          </div>
          <Campo label="Responsável">
            <Select value={f.responsavel} onValueChange={(v) => set("responsavel", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o supervisor" />
              </SelectTrigger>
              <SelectContent>
                {supervisores.map((s) => (
                  <SelectItem key={s.id} value={s.nome}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Linha / Setor">
            <Input
              value={f.setor}
              maxLength={120}
              placeholder="Ex.: Moinho 1, Embalagem"
              onChange={(e) => set("setor", e.target.value)}
            />
          </Campo>
          <Campo label="Equipe presente" className="md:col-span-3">
            <div className="flex flex-wrap gap-2">
              {f.equipe.map((membro) => (
                <span
                  key={membro.nome}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                >
                  {membro.nome}
                  {membro.funcao && (
                    <span className="text-primary-foreground/75">— {membro.funcao}</span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "equipe",
                        f.equipe.filter((m) => m.nome !== membro.nome),
                      )
                    }
                    className="opacity-80 hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              {!f.equipe.length && (
                <span className="text-sm text-muted-foreground">Ninguém selecionado.</span>
              )}
            </div>
            <Select
              value=""
              onValueChange={(v) => {
                const colaborador = colaboradores.find((c) => c.nome === v);
                if (colaborador && !f.equipe.some((m) => m.nome === v)) {
                  set("equipe", [
                    ...f.equipe,
                    { nome: colaborador.nome, funcao: colaborador.funcao },
                  ]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Adicionar colaborador" />
              </SelectTrigger>
              <SelectContent>
                {colaboradores
                  .filter((c) => !f.equipe.some((m) => m.nome === c.nome))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                      {c.funcao ? ` — ${c.funcao}` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Campo>
        </div>
      </Secao>

      <Secao numero="2" titulo="Resumo do turno">
        <Textarea
          rows={4}
          maxLength={4000}
          value={f.resumo}
          placeholder="Como o turno transcorreu, ocorrências relevantes..."
          onChange={(e) => set("resumo", e.target.value)}
        />
      </Secao>

      <Secao numero="3" titulo="Produção">
        <div className="space-y-3">
          {f.producao.map((p, i) => (
            <div key={i} className="grid gap-3 rounded-md bg-secondary/40 p-3 md:grid-cols-12">
              <Campo label="Produto" className="md:col-span-3">
                <Input
                  value={p.produto}
                  onChange={(e) =>
                    set("producao", edit(f.producao, i, { produto: e.target.value }))
                  }
                />
              </Campo>
              {(
                [
                  ["produzido", "Produzido"],
                  ["meta", "Meta"],
                  ["refugo", "Refugo"],
                  ["reprocesso", "Reprocesso"],
                ] as [keyof ProducaoItem, string][]
              ).map(([k, label]) => (
                <Campo key={k} label={label} className="md:col-span-2">
                  <Input
                    type="number"
                    value={String(p[k] ?? 0)}
                    onChange={(e) =>
                      set("producao", edit(f.producao, i, { [k]: Number(e.target.value) || 0 }))
                    }
                  />
                </Campo>
              ))}
              <div className="flex items-end md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => set("producao", remove(f.producao, i))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              set("producao", [
                ...f.producao,
                { produto: "", produzido: 0, meta: 0, refugo: 0, reprocesso: 0 },
              ])
            }
          >
            <Plus className="size-4" /> Adicionar produto
          </Button>
        </div>
      </Secao>

      <Secao numero="4" titulo="Status dos silos">
        <div className="space-y-4">
          {f.silos.map((grupo, gIdx) => (
            <section key={grupo.id} className="overflow-hidden rounded-lg border border-success/40">
              <header className="flex items-center gap-3 border-b border-success/40 bg-success/10 px-4 py-2.5">
                <span className="h-6 w-1.5 rounded bg-success" />
                <span className="flex-1 text-sm font-bold uppercase tracking-wide">
                  {grupo.titulo}
                </span>
              </header>
              <div className="space-y-2 p-3">
                {grupo.itens.map((item, iIdx) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-2 rounded-md bg-secondary/40 p-2"
                  >
                    <span className="w-10 shrink-0 text-sm font-medium">Silo {item.numero}</span>
                    <Input
                      className="w-full sm:w-36"
                      placeholder="Volume"
                      value={item.volume}
                      onChange={(e) => updateSiloItem(gIdx, iIdx, { volume: e.target.value })}
                    />
                    <Input
                      className="min-w-[160px] flex-1"
                      placeholder="Produto"
                      value={item.produto}
                      onChange={(e) => updateSiloItem(gIdx, iIdx, { produto: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Secao>

      <Secao numero="5" titulo="Equipamentos">
        <div className="space-y-4">
          {f.equipamentos.map((grupo, gIdx) => (
            <section key={grupo.id} className="overflow-hidden rounded-lg border border-success/40">
              <header className="flex items-center gap-3 border-b border-success/40 bg-success/10 px-4 py-2.5">
                <span className="h-6 w-1.5 rounded bg-success" />
                <span className="flex-1 text-sm font-bold uppercase tracking-wide">
                  {grupo.titulo}
                </span>
              </header>
              <div className="space-y-2 p-3">
                {grupo.itens.map((item, iIdx) => {
                  const parado = item.status.trim().toUpperCase() === "PARADO";
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-wrap items-center gap-2 rounded-md p-2 ${
                        parado
                          ? "border border-destructive/40 bg-destructive/10"
                          : "bg-secondary/40"
                      }`}
                    >
                      <span className="w-full shrink-0 text-sm font-medium sm:w-44">
                        {item.nome}
                      </span>
                      <Select
                        value={item.status}
                        onValueChange={(v) => updateEquipamentoItem(gIdx, iIdx, { status: v })}
                      >
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PARADO">Parado</SelectItem>
                          <SelectItem value="OPERAÇÃO">Operação</SelectItem>
                        </SelectContent>
                      </Select>
                      {grupo.mostrarHorimetro && (
                        <Input
                          className="w-full sm:w-32"
                          placeholder="Horímetro"
                          value={item.horimetro}
                          onChange={(e) =>
                            updateEquipamentoItem(gIdx, iIdx, { horimetro: e.target.value })
                          }
                        />
                      )}
                      {grupo.mostrarTela && (
                        <Input
                          className="w-full sm:w-24"
                          placeholder="Tela"
                          value={item.tela}
                          onChange={(e) =>
                            updateEquipamentoItem(gIdx, iIdx, { tela: e.target.value })
                          }
                        />
                      )}
                      <Input
                        className="min-w-[160px] flex-1"
                        placeholder="Observação"
                        value={item.observacao}
                        onChange={(e) =>
                          updateEquipamentoItem(gIdx, iIdx, { observacao: e.target.value })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Secao>

      <Secao numero="6" titulo="Paradas e anomalias">
        <div className="space-y-3">
          {f.paradas.map((p, i) => (
            <div key={i} className="grid gap-3 rounded-md bg-secondary/40 p-3 md:grid-cols-12">
              <Campo label="Hora" className="md:col-span-2">
                <Input
                  value={p.hora}
                  placeholder="09:30"
                  onChange={(e) => set("paradas", edit(f.paradas, i, { hora: e.target.value }))}
                />
              </Campo>
              <Campo label="Equipamento" className="md:col-span-3">
                <Input
                  value={p.equipamento}
                  onChange={(e) =>
                    set("paradas", edit(f.paradas, i, { equipamento: e.target.value }))
                  }
                />
              </Campo>
              <Campo label="Motivo" className="md:col-span-4">
                <Input
                  value={p.motivo}
                  onChange={(e) => set("paradas", edit(f.paradas, i, { motivo: e.target.value }))}
                />
              </Campo>
              <Campo label="Tempo (min)" className="md:col-span-2">
                <Input
                  type="number"
                  value={String(p.tempo ?? 0)}
                  onChange={(e) =>
                    set("paradas", edit(f.paradas, i, { tempo: Number(e.target.value) || 0 }))
                  }
                />
              </Campo>
              <div className="flex items-end md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => set("paradas", remove(f.paradas, i))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              set("paradas", [
                ...f.paradas,
                { hora: "", equipamento: "", motivo: "", tempo: 0 } as ParadaItem,
              ])
            }
          >
            <Plus className="size-4" /> Registrar parada
          </Button>
        </div>
      </Secao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao numero="7" titulo="Qualidade">
          <Textarea
            rows={4}
            maxLength={2000}
            value={f.qualidade}
            placeholder="Umidade, granulometria, peso, não conformidades, produtos bloqueados..."
            onChange={(e) => set("qualidade", e.target.value)}
          />
        </Secao>
        <Secao numero="8" titulo="Estoque">
          <Textarea
            rows={4}
            maxLength={2000}
            value={f.estoque}
            placeholder="Matéria-prima, embalagens, risco de falta..."
            onChange={(e) => set("estoque", e.target.value)}
          />
        </Secao>
        <Secao numero="9" titulo="Manutenção">
          <Textarea
            rows={4}
            maxLength={2000}
            value={f.manutencao}
            placeholder="Chamados abertos, concluídos, solicitações para o próximo turno..."
            onChange={(e) => set("manutencao", e.target.value)}
          />
        </Secao>
        <Secao numero="10" titulo="Segurança">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Acidentes">
              <Input
                type="number"
                value={String(f.seguranca.acidentes)}
                onChange={(e) =>
                  set("seguranca", {
                    ...f.seguranca,
                    acidentes: Number(e.target.value) || 0,
                  })
                }
              />
            </Campo>
            <Campo label="Quase acidentes">
              <Input
                type="number"
                value={String(f.seguranca.quase_acidentes)}
                onChange={(e) =>
                  set("seguranca", {
                    ...f.seguranca,
                    quase_acidentes: Number(e.target.value) || 0,
                  })
                }
              />
            </Campo>
          </div>
          <Textarea
            className="mt-4"
            rows={3}
            maxLength={2000}
            value={f.seguranca.observacoes}
            placeholder="EPIs, condições inseguras encontradas..."
            onChange={(e) => set("seguranca", { ...f.seguranca, observacoes: e.target.value })}
          />
        </Secao>
      </div>

      <Secao numero="11" titulo="Limpeza e organização (5S)">
        <Textarea
          rows={3}
          maxLength={2000}
          value={f.limpeza}
          placeholder="Limpeza realizada, pendente, programa 5S..."
          onChange={(e) => set("limpeza", e.target.value)}
        />
      </Secao>

      <Secao numero="12" titulo="Pendências para o próximo turno">
        <div className="space-y-3">
          {f.pendencias.map((p, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-md bg-secondary/40 p-3">
              <Campo label="Descrição" className="min-w-[240px] flex-1">
                <Input
                  value={p.descricao}
                  onChange={(e) =>
                    set("pendencias", edit(f.pendencias, i, { descricao: e.target.value }))
                  }
                />
              </Campo>
              <Campo label="Situação" className="w-44">
                <Select
                  value={p.resolvida ? "resolvida" : "aberta"}
                  onValueChange={(v) =>
                    set("pendencias", edit(f.pendencias, i, { resolvida: v === "resolvida" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Em aberto</SelectItem>
                    <SelectItem value="resolvida">Resolvida</SelectItem>
                  </SelectContent>
                </Select>
              </Campo>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => set("pendencias", remove(f.pendencias, i))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              set("pendencias", [
                ...f.pendencias,
                { descricao: "", resolvida: false } as PendenciaItem,
              ])
            }
          >
            <Plus className="size-4" /> Adicionar pendência
          </Button>
        </div>
      </Secao>

      <Secao numero="13" titulo="Observações e aprovações">
        <Textarea
          rows={3}
          maxLength={2000}
          value={f.observacoes}
          placeholder="Qualquer informação adicional..."
          onChange={(e) => set("observacoes", e.target.value)}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Campo label="Turno que entregou">
            <Input
              value={f.entregue_por}
              maxLength={120}
              onChange={(e) => set("entregue_por", e.target.value)}
            />
          </Campo>
          <Campo label="Turno que recebeu">
            <Input
              value={f.recebido_por}
              maxLength={120}
              onChange={(e) => set("recebido_por", e.target.value)}
            />
          </Campo>
        </div>
      </Secao>

      <div className="sticky bottom-4 flex flex-wrap gap-3 rounded-lg border border-border bg-card/95 p-4 backdrop-blur">
        <Button disabled={salvando} onClick={() => onSalvar("finalizado")}>
          <Save className="size-4" /> Finalizar e salvar
        </Button>
        <Button variant="secondary" disabled={salvando} onClick={() => onSalvar("rascunho")}>
          Salvar rascunho
        </Button>
        {onPdf && (
          <Button variant="outline" type="button" onClick={onPdf}>
            <FileDown className="size-4" /> Gerar PDF
          </Button>
        )}
      </div>
    </div>
  );
}

function edit<T>(lista: T[], i: number, patch: Partial<T>): T[] {
  return lista.map((item, idx) => (idx === i ? { ...item, ...patch } : item));
}

function remove<T>(lista: T[], i: number): T[] {
  return lista.filter((_, idx) => idx !== i);
}
