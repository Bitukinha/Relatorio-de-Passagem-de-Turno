import { useSession as startSession } from "@tanstack/react-start/server";
import { sql } from "./db.server";
import type { Papel, Usuario } from "./auth.functions";

type SessionData = { userId?: string };

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }
  return { password, name: "pt_session" };
}

export function getSessionManager() {
  return startSession<SessionData>(sessionConfig());
}

export async function getCurrentUsuario(): Promise<Usuario | null> {
  const session = await getSessionManager();
  const userId = session.data.userId;
  if (!userId) return null;
  const rows = await sql`
    SELECT id, nome, papel FROM usuarios WHERE id = ${userId} AND ativo = true LIMIT 1
  `;
  return (rows[0] as Usuario | undefined) ?? null;
}

export async function requireUsuario(): Promise<Usuario> {
  const usuario = await getCurrentUsuario();
  if (!usuario) throw new Error("Sessão expirada. Faça login novamente.");
  return usuario;
}

export async function requireAdmin(): Promise<Usuario> {
  const usuario = await requireUsuario();
  if (usuario.papel !== ("admin" satisfies Papel)) {
    throw new Error("Apenas administradores podem fazer isso.");
  }
  return usuario;
}
