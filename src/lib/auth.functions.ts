import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "./db.server";
import { getCurrentUsuario, getSessionManager } from "./session.server";

export type Papel = "turno_a" | "turno_b" | "turno_c" | "admin";

export type Usuario = {
  id: string;
  nome: string;
  papel: Papel;
};

export const listUsuariosAtivos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Usuario[]> => {
    const rows = await sql`
      SELECT id, nome, papel FROM usuarios WHERE ativo = true ORDER BY papel, nome
    `;
    return rows as Usuario[];
  },
);

export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<Usuario | null> => {
    return getCurrentUsuario();
  },
);

export const login = createServerFn({ method: "POST" })
  .validator(z.object({ usuarioId: z.string() }))
  .handler(async ({ data: { usuarioId } }): Promise<Usuario> => {
    const rows = await sql`
      SELECT id, nome, papel FROM usuarios WHERE id = ${usuarioId} AND ativo = true LIMIT 1
    `;
    const usuario = rows[0] as Usuario | undefined;
    if (!usuario) throw new Error("Usuário não encontrado.");
    const session = await getSessionManager();
    await session.update({ userId: usuario.id });
    return usuario;
  });

export const logout = createServerFn({ method: "POST" }).handler(async (): Promise<void> => {
  const session = await getSessionManager();
  await session.clear();
});
