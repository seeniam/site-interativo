/**
 * Só para testes: Postgres em memória (pg-mem) rodando o `db/schema.sql` de verdade.
 * Assim o SQL do adaptador e as rotas são testados contra o schema que vai para produção.
 */
import fs from "node:fs";
import path from "node:path";
import { newDb } from "pg-mem";
import type { Executor } from "./postgres";

const SCHEMA = fs.readFileSync(path.resolve(import.meta.dirname, "../../../db/schema.sql"), "utf8");

export function bancoDeTeste(): { executar: Executor; consultas: string[] } {
  const db = newDb();
  db.public.none(SCHEMA);
  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  const consultas: string[] = [];
  return {
    consultas,
    executar: async (texto, parametros) => {
      consultas.push(texto);
      const resultado = await pool.query(texto, [...parametros]);
      return resultado.rows as Record<string, unknown>[];
    },
  };
}
