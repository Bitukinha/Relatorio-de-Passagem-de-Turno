export type Turno = "A" | "B" | "C";

export const TURNOS: Record<Turno, { nome: string; inicio: string; fim: string }> = {
  A: { nome: "Turno A", inicio: "06:00", fim: "14:20" },
  B: { nome: "Turno B", inicio: "14:20", fim: "22:40" },
  C: { nome: "Turno C", inicio: "22:40", fim: "06:00" },
};

export const ESCALA = "6x1 — segunda a sábado";

export type ProducaoItem = {
  produto: string;
  produzido: number;
  meta: number;
  refugo: number;
  reprocesso: number;
};

export type MaquinaLinha = {
  equipamento: string;
  status: string;
  observacao: string;
};

export type MaquinaSetor = {
  id: string;
  titulo: string;
  linhas: MaquinaLinha[];
  observacaoGeral: string;
};

export const SETORES_MAQUINAS = [
  "Degerminação",
  "Moagem",
  "Moinhos vieiras",
  "Moinho — Banco de cilindros",
  "Setor extrusoras",
  "Moinhos vieiras 950 e 680 A",
] as const;

function novoSetorMaquinas(titulo: string): MaquinaSetor {
  return {
    id: titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    titulo,
    linhas: [{ equipamento: "", status: "", observacao: "" }],
    observacaoGeral: "",
  };
}

export type ParadaItem = {
  hora: string;
  equipamento: string;
  motivo: string;
  tempo: number;
};

export type PendenciaItem = {
  descricao: string;
  resolvida: boolean;
};

export type Seguranca = {
  acidentes: number;
  quase_acidentes: number;
  observacoes: string;
};

export type ShiftReport = {
  id: string;
  criado_por: string;
  data: string;
  turno: Turno;
  hora_inicio: string;
  hora_fim: string;
  responsavel: string;
  equipe: string[];
  setor: string;
  resumo: string;
  producao: ProducaoItem[];
  maquinas: MaquinaSetor[];
  paradas: ParadaItem[];
  qualidade: string;
  estoque: string;
  manutencao: string;
  seguranca: Seguranca;
  limpeza: string;
  pendencias: PendenciaItem[];
  observacoes: string;
  entregue_por: string;
  recebido_por: string;
  status: "rascunho" | "finalizado";
  created_at: string;
  updated_at: string;
};

export type ShiftReportInput = Omit<ShiftReport, "id" | "criado_por" | "created_at" | "updated_at">;

export function emptyReport(): ShiftReportInput {
  const hoje = new Date().toISOString().slice(0, 10);
  return {
    data: hoje,
    turno: "A",
    hora_inicio: TURNOS.A.inicio,
    hora_fim: TURNOS.A.fim,
    responsavel: "",
    equipe: [],
    setor: "",
    resumo: "",
    producao: [{ produto: "", produzido: 0, meta: 0, refugo: 0, reprocesso: 0 }],
    maquinas: SETORES_MAQUINAS.map(novoSetorMaquinas),
    paradas: [],
    qualidade: "",
    estoque: "",
    manutencao: "",
    seguranca: { acidentes: 0, quase_acidentes: 0, observacoes: "" },
    limpeza: "",
    pendencias: [],
    observacoes: "",
    entregue_por: "",
    recebido_por: "",
    status: "rascunho",
  };
}

export const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);

export function totalProduzido(r: Pick<ShiftReport, "producao">) {
  return r.producao.reduce((s, p) => s + num(p.produzido), 0);
}

export function totalMeta(r: Pick<ShiftReport, "producao">) {
  return r.producao.reduce((s, p) => s + num(p.meta), 0);
}

export function tempoParado(r: Pick<ShiftReport, "paradas">) {
  return r.paradas.reduce((s, p) => s + num(p.tempo), 0);
}

export function pendenciasAbertas(r: Pick<ShiftReport, "pendencias">) {
  return r.pendencias.filter((p) => !p.resolvida);
}

export function formatarData(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function formatarNumero(v: number, casas = 0) {
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}
