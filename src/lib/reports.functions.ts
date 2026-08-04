import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "./db.server";
import { requireUsuario } from "./session.server";
import type { ShiftReport, ShiftReportInput } from "./shift";

function toIsoDate(v: unknown): string {
  return v instanceof Date ? v.toISOString().slice(0, 10) : (v as string);
}

function toIsoDateTime(v: unknown): string {
  return v instanceof Date ? v.toISOString() : (v as string);
}

function normalize(row: Record<string, unknown>): ShiftReport {
  return {
    ...(row as unknown as ShiftReport),
    data: toIsoDate(row["data"]),
    created_at: toIsoDateTime(row["created_at"]),
    updated_at: toIsoDateTime(row["updated_at"]),
    equipe: (row["equipe"] as ShiftReport["equipe"]) ?? [],
    producao: (row["producao"] as ShiftReport["producao"]) ?? [],
    maquinas: (row["maquinas"] as ShiftReport["maquinas"]) ?? [],
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
        producao, maquinas, paradas, qualidade, estoque, manutencao, seguranca, limpeza,
        pendencias, observacoes, entregue_por, recebido_por, status
      ) VALUES (
        ${usuario.nome}, ${r.data}, ${r.turno}, ${r.hora_inicio}, ${r.hora_fim}, ${r.responsavel},
        ${JSON.stringify(r.equipe)}::jsonb,
        ${r.setor}, ${r.resumo}, ${JSON.stringify(r.producao)}::jsonb, ${JSON.stringify(r.maquinas)}::jsonb,
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
        producao = ${JSON.stringify(r.producao)}::jsonb, maquinas = ${JSON.stringify(r.maquinas)}::jsonb,
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
