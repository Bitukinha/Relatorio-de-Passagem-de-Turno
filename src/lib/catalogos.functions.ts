import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "./db.server";
import { requireAdmin, requireUsuario } from "./session.server";

export type Equipamento = { id: string; setor: string; nome: string };
export type Supervisor = { id: string; nome: string };
export type Colaborador = { id: string; nome: string; funcao: string };

export const listEquipamentos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Equipamento[]> => {
    await requireUsuario();
    const rows = await sql`SELECT id, setor, nome FROM equipamentos ORDER BY setor, nome`;
    return rows as Equipamento[];
  },
);

export const createEquipamento = createServerFn({ method: "POST" })
  .validator(z.object({ setor: z.string().min(1), nome: z.string().min(1) }))
  .handler(async ({ data: { setor, nome } }): Promise<Equipamento> => {
    await requireAdmin();
    const rows = await sql`
      INSERT INTO equipamentos (setor, nome) VALUES (${setor}, ${nome}) RETURNING id, setor, nome
    `;
    return rows[0] as Equipamento;
  });

export const deleteEquipamento = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: id }): Promise<void> => {
    await requireAdmin();
    await sql`DELETE FROM equipamentos WHERE id = ${id}`;
  });

export const listSupervisores = createServerFn({ method: "GET" }).handler(
  async (): Promise<Supervisor[]> => {
    await requireUsuario();
    const rows = await sql`SELECT id, nome FROM supervisores ORDER BY nome`;
    return rows as Supervisor[];
  },
);

export const createSupervisor = createServerFn({ method: "POST" })
  .validator(z.object({ nome: z.string().min(1) }))
  .handler(async ({ data: { nome } }): Promise<Supervisor> => {
    await requireAdmin();
    const rows = await sql`INSERT INTO supervisores (nome) VALUES (${nome}) RETURNING id, nome`;
    return rows[0] as Supervisor;
  });

export const deleteSupervisor = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: id }): Promise<void> => {
    await requireAdmin();
    await sql`DELETE FROM supervisores WHERE id = ${id}`;
  });

export const listColaboradores = createServerFn({ method: "GET" }).handler(
  async (): Promise<Colaborador[]> => {
    await requireUsuario();
    const rows = await sql`SELECT id, nome, funcao FROM colaboradores ORDER BY nome`;
    return rows as Colaborador[];
  },
);

export const createColaborador = createServerFn({ method: "POST" })
  .validator(z.object({ nome: z.string().min(1), funcao: z.string() }))
  .handler(async ({ data: { nome, funcao } }): Promise<Colaborador> => {
    await requireAdmin();
    const rows = await sql`
      INSERT INTO colaboradores (nome, funcao) VALUES (${nome}, ${funcao}) RETURNING id, nome, funcao
    `;
    return rows[0] as Colaborador;
  });

export const deleteColaborador = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: id }): Promise<void> => {
    await requireAdmin();
    await sql`DELETE FROM colaboradores WHERE id = ${id}`;
  });
