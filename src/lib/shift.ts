export type Turno = "A" | "B" | "C";

export const TURNOS: Record<Turno, { nome: string; inicio: string; fim: string }> = {
  A: { nome: "Turno A", inicio: "06:00", fim: "14:20" },
  B: { nome: "Turno B", inicio: "14:20", fim: "22:40" },
  C: { nome: "Turno C", inicio: "22:40", fim: "06:00" },
};

export const ESCALA = "6x1 — segunda a sábado";

export type EquipeMembro = {
  nome: string;
  funcao: string;
};

export type ProducaoItem = {
  produto: string;
  produzido: number;
  meta: number;
  refugo: number;
  reprocesso: number;
};

export type EquipamentoItem = {
  id: string;
  nome: string;
  status: string;
  horimetro: string;
  tela: string;
  observacao: string;
};

export type EquipamentoGrupo = {
  id: string;
  titulo: string;
  mostrarHorimetro: boolean;
  mostrarTela: boolean;
  itens: EquipamentoItem[];
};

function slug(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const GRUPOS_EQUIPAMENTOS_PADRAO: {
  titulo: string;
  itens: string[];
  horimetro: boolean;
  tela: boolean;
}[] = [
  { titulo: "Pós-limpeza", itens: ["CLPZ 1", "CLPZ 2"], horimetro: true, tela: false },
  {
    titulo: "Degerminadoras",
    itens: ["DHZ 1", "DHZ 2", "DHZ 3", "DHZ 4", "DHZ 5"],
    horimetro: true,
    tela: false,
  },
  {
    titulo: "Bancos de cilindro",
    itens: [
      "T1 — Lado A",
      "T1 — Lado B",
      "T2 — Lado A",
      "T2 — Lado B",
      "T3 — Lado A",
      "T3 — Lado B",
    ],
    horimetro: true,
    tela: false,
  },
  {
    titulo: "Moinhos martelo",
    itens: ["M1", "M2", "M3", "M6", "M7", "M8"],
    horimetro: true,
    tela: true,
  },
  {
    titulo: "Classificação",
    itens: ["PL-1 (Sangati)", "Monocanal"],
    horimetro: false,
    tela: false,
  },
  {
    titulo: "Extrusão",
    itens: ["Extrusora 01 (Ferraz)", "Extrusora 02 (Zeng)"],
    horimetro: true,
    tela: false,
  },
  { titulo: "Envase", itens: ["DAPX", "INSACK", "SAT"], horimetro: false, tela: false },
];

export function novosEquipamentos(): EquipamentoGrupo[] {
  return GRUPOS_EQUIPAMENTOS_PADRAO.map((grupo) => ({
    id: slug(grupo.titulo),
    titulo: grupo.titulo,
    mostrarHorimetro: grupo.horimetro,
    mostrarTela: grupo.tela,
    itens: grupo.itens.map((nome) => ({
      id: slug(`${grupo.titulo}-${nome}`),
      nome,
      status: "",
      horimetro: "",
      tela: "",
      observacao: "",
    })),
  }));
}

export type SiloItem = {
  id: string;
  numero: string;
  volume: string;
  produto: string;
};

export type SiloGrupo = {
  id: string;
  titulo: string;
  itens: SiloItem[];
};

const GRUPOS_SILOS_PADRAO: { titulo: string; quantidade: number }[] = [
  { titulo: "Silos de canjica", quantidade: 3 },
  { titulo: "Silos de P.A. (moagem)", quantidade: 6 },
  { titulo: "Silos de P.A. extrusão", quantidade: 4 },
];

export function novosSilos(): SiloGrupo[] {
  return GRUPOS_SILOS_PADRAO.map((grupo) => ({
    id: slug(grupo.titulo),
    titulo: grupo.titulo,
    itens: Array.from({ length: grupo.quantidade }, (_, i) => ({
      id: slug(`${grupo.titulo}-${i + 1}`),
      numero: String(i + 1),
      volume: "",
      produto: "",
    })),
  }));
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
  equipe: EquipeMembro[];
  setor: string;
  resumo: string;
  producao: ProducaoItem[];
  silos: SiloGrupo[];
  equipamentos: EquipamentoGrupo[];
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
    silos: novosSilos(),
    equipamentos: novosEquipamentos(),
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
