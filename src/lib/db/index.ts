/**
 * Ponto de entrada da camada de dados — só servidor. Importar isto num client component
 * quebra o build (server-only): o navegador nunca fala com o banco (briefing 5).
 */
import "server-only";
import { neon } from "@neondatabase/serverless";
import { casamento } from "@/config/casamento";
import { lerAmbiente, type Ambiente } from "./ambiente";
import { criarRepositorioMemoria, seedDemonstracao } from "./memoria";
import { criarRepositorioPostgres } from "./postgres";
import type { RepositorioCasamento } from "./repositorio";

export type { RepositorioCasamento } from "./repositorio";
export { hashTelefone } from "./hash";

interface Estado {
  ambiente: Ambiente;
  repositorio: RepositorioCasamento;
}

// No globalThis: em desenvolvimento o Next recarrega módulos, e a memória da demo não pode zerar a cada edição.
const global = globalThis as typeof globalThis & { __casamentoDados?: Estado };

function criar(): Estado {
  const ambiente = lerAmbiente({
    DATABASE_URL: process.env.DATABASE_URL,
    SENHA_NOIVOS: process.env.SENHA_NOIVOS,
    SESSAO_SECRET: process.env.SESSAO_SECRET,
    RSVP_SALT: process.env.RSVP_SALT,
    DEMO: process.env.DEMO,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
  if (ambiente.modo === "demonstracao") {
    const { ela, ele } = casamento.noivos;
    return {
      ambiente,
      repositorio: criarRepositorioMemoria({ iniciais: seedDemonstracao(ambiente.sal, new Date(), [ela, ele]) }),
    };
  }
  const sql = neon(ambiente.databaseUrl);
  return {
    ambiente,
    repositorio: criarRepositorioPostgres((texto, parametros) => sql.query(texto, [...parametros])),
  };
}

function estado(): Estado {
  global.__casamentoDados ??= criar();
  return global.__casamentoDados;
}

export function obterRepositorio(): RepositorioCasamento {
  return estado().repositorio;
}

export function obterAmbiente(): Ambiente {
  return estado().ambiente;
}
