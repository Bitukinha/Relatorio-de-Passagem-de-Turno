import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "./db.server";
import { requireUsuario } from "./session.server";
import { novosEquipamentos, novosSilos, type ShiftReport, type ShiftReportInput } from "./shift";

function toIsoDate(v: unknown): string {
  return v instanceof Date ? v.toISOString().slice(0, 10) : (v as string);
}

function toIsoDateTime(v: unknown): string {
  return v instanceof Date ? v.toISOString() : (v as string);
}

function normalizeEquipe(v: unknown): ShiftReport["equipe"] {
  if (!Array.isArray(v)) return [];
  return v.map((item) =>
    typeof item === "string" ? { nome: item, funcao: "" } : (item as ShiftReport["equipe"][number]),
  );
}

// Relatórios criados antes da checklist fixa de equipamentos guardam um formato
// diferente (setores com "linhas" em vez de grupos com "itens"). Sem forma de
// mapear os dados antigos para os itens fixos atuais, cai no checklist padrão.
function normalizeEquipamentos(v: unknown): ShiftReport["equipamentos"] {
  if (!Array.isArray(v) || !v.length) return novosEquipamentos();
  const formatoAtual = v.every(
    (g) => g && typeof g === "object" && Array.isArray((g as { itens?: unknown }).itens),
  );
  return formatoAtual ? (v as ShiftReport["equipamentos"]) : novosEquipamentos();
}

function normalizeSilos(v: unknown): ShiftReport["silos"] {
  return Array.isArray(v) && v.length ? (v as ShiftReport["silos"]) : novosSilos();
}

function normalize(row: Record<string, unknown>): ShiftReport {
  return {
    ...(row as unknown as ShiftReport),
    data: toIsoDate(row["data"]),
    created_at: toIsoDateTime(row["created_at"]),
    updated_at: toIsoDateTime(row["updated_at"]),
    equipe: normalizeEquipe(row["equipe"]),
    producao: (row["producao"] as ShiftReport["producao"]) ?? [],
    silos: normalizeSilos(row["silos"]),
    equipamentos: normalizeEquipamentos(row["equipamentos"]),
    paradas: (row["paradas"] as ShiftReport["paradas"]) ?? [],
    pendencias: (row["pendencias"] as ShiftReport["pendencias"]) ?? [],
    seguranca:
      (row["seguranca"] as ShiftReport["seguranca"]) ??
      ({ acidentes: 0, quase_acidentes: 0, observacoes: "" } as ShiftReport["seguranca"]),
  };
}

export const listReports = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShiftReport[]> => {
    await requireUsuario();
    const rows = await sql`
      SELECT * FROM shift_reports ORDER BY data DESC, created_at DESC LIMIT 500
    `;
    return rows.map((r) => normalize(r as Record<string, unknown>));
  },
);

export const getReport = createServerFn({ method: "GET" })
  .validator(z.string())
  .handler(async ({ data: id }): Promise<ShiftReport | null> => {
    await requireUsuario();
    const rows = await sql`SELECT * FROM shift_reports WHERE id = ${id} LIMIT 1`;
    return rows[0] ? normalize(rows[0] as Record<string, unknown>) : null;
  });

export const createReport = createServerFn({ method: "POST" })
  .validator((input: ShiftReportInput) => input)
  .handler(async ({ data: r }): Promise<ShiftReport> => {
    const usuario = await requireUsuario();
    const rows = await sql`
      INSERT INTO shift_reports (
        criado_por, data, turno, hora_inicio, hora_fim, responsavel, equipe, setor, resumo,
        producao, silos, equipamentos, paradas, qualidade, estoque, manutencao, seguranca, limpeza,
        pendencias, observacoes, entregue_por, recebido_por, status
      ) VALUES (
        ${usuario.nome}, ${r.data}, ${r.turno}, ${r.hora_inicio}, ${r.hora_fim}, ${r.responsavel},
        ${JSON.stringify(r.equipe)}::jsonb,
        ${r.setor}, ${r.resumo}, ${JSON.stringify(r.producao)}::jsonb, ${JSON.stringify(r.silos)}::jsonb,
        ${JSON.stringify(r.equipamentos)}::jsonb,
        ${JSON.stringify(r.paradas)}::jsonb, ${r.qualidade}, ${r.estoque}, ${r.manutencao},
        ${JSON.stringify(r.seguranca)}::jsonb, ${r.limpeza}, ${JSON.stringify(r.pendencias)}::jsonb,
        ${r.observacoes}, ${r.entregue_por}, ${r.recebido_por}, ${r.status}
      )
      RETURNING *
    `;
    return normalize(rows[0] as Record<string, unknown>);
  });

export const updateReport = createServerFn({ method: "POST" })
  .validator((input: { id: string; report: ShiftReportInput }) => input)
  .handler(async ({ data: { id, report: r } }): Promise<ShiftReport> => {
    await requireUsuario();
    const rows = await sql`
      UPDATE shift_reports SET
        data = ${r.data}, turno = ${r.turno}, hora_inicio = ${r.hora_inicio}, hora_fim = ${r.hora_fim},
        responsavel = ${r.responsavel}, equipe = ${JSON.stringify(r.equipe)}::jsonb,
        setor = ${r.setor}, resumo = ${r.resumo},
        producao = ${JSON.stringify(r.producao)}::jsonb, silos = ${JSON.stringify(r.silos)}::jsonb,
        equipamentos = ${JSON.stringify(r.equipamentos)}::jsonb,
        paradas = ${JSON.stringify(r.paradas)}::jsonb, qualidade = ${r.qualidade}, estoque = ${r.estoque},
        manutencao = ${r.manutencao}, seguranca = ${JSON.stringify(r.seguranca)}::jsonb,
        limpeza = ${r.limpeza}, pendencias = ${JSON.stringify(r.pendencias)}::jsonb,
        observacoes = ${r.observacoes}, entregue_por = ${r.entregue_por}, recebido_por = ${r.recebido_por},
        status = ${r.status}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows[0]) throw new Error("Relatório não encontrado.");
    return normalize(rows[0] as Record<string, unknown>);
  });

export const deleteReport = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: id }): Promise<void> => {
    await requireUsuario();
    await sql`DELETE FROM shift_reports WHERE id = ${id}`;
  });
