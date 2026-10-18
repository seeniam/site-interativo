/**
 * Lê as variáveis do servidor e decide o modo de operação (briefing 5).
 * Nenhuma variável aqui tem prefixo NEXT_PUBLIC_: segredos nunca vão para o navegador.
 */

export interface VariaveisServidor {
  DATABASE_URL?: string;
  SENHA_NOIVOS?: string;
  SESSAO_SECRET?: string;
  RSVP_SALT?: string;
  DEMO?: string;
  /** Definida pela Vercel: "production", "preview" ou "development". */
  VERCEL_ENV?: string;
}

/** Valores fixos e públicos da demonstração — só valem com DEMO ligado ou sem banco. */
export const DEMONSTRACAO = {
  senhaNoivos: "demo",
  segredoSessao: "demonstracao-segredo-de-sessao-nao-usar-em-producao",
  sal: "demonstracao-sal-nao-usar-em-producao",
} as const;

export type Ambiente =
  | { modo: "demonstracao"; senhaNoivos: string; segredoSessao: string; sal: string }
  | { modo: "producao"; databaseUrl: string; senhaNoivos: string; segredoSessao: string; sal: string };

export class AmbienteInvalido extends Error {
  override name = "AmbienteInvalido";
}

const ligado = (valor?: string) => ["true", "1"].includes(valor?.trim().toLowerCase() ?? "");

const MINIMOS = { SENHA_NOIVOS: 8, SESSAO_SECRET: 32, RSVP_SALT: 16 } as const;

export function lerAmbiente(v: VariaveisServidor): Ambiente {
  const databaseUrl = v.DATABASE_URL?.trim() ?? "";
  const demo = ligado(v.DEMO);

  if (demo || !databaseUrl) {
    // Dado pessoal (DECISOES V3): na produção da Vercel, banco ausente é erro — senão as
    // respostas reais iriam para a memória e se perderiam.
    if (!demo && v.VERCEL_ENV === "production") {
      throw new AmbienteInvalido(
        "Produção sem DATABASE_URL. Crie o Postgres pelo Marketplace da Vercel, ou defina DEMO=true para uma demonstração.",
      );
    }
    return { modo: "demonstracao", ...DEMONSTRACAO };
  }

  const faltando = (Object.entries(MINIMOS) as [keyof typeof MINIMOS, number][])
    .filter(([nome, minimo]) => (v[nome]?.trim().length ?? 0) < minimo)
    .map(([nome, minimo]) => `${nome} (mínimo ${minimo} caracteres)`);
  if (faltando.length > 0) {
    throw new AmbienteInvalido(`Com DATABASE_URL, também são obrigatórias: ${faltando.join(", ")}.`);
  }

  return {
    modo: "producao",
    databaseUrl,
    senhaNoivos: v.SENHA_NOIVOS?.trim() ?? "",
    segredoSessao: v.SESSAO_SECRET?.trim() ?? "",
    sal: v.RSVP_SALT?.trim() ?? "",
  };
}
