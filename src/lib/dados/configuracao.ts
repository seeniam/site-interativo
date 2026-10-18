/**
 * Lê as chaves públicas do Firebase e decide de onde vêm os dados.
 * As chaves `NEXT_PUBLIC_*` são públicas por natureza; a proteção dos dados está em
 * firestore.rules. Chave de serviço (admin) nunca entra no cliente.
 */
export interface ConfigFirebase {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export interface VariaveisFirebase {
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  /** "1" libera a demonstração local num build de produção (ex.: preview para o casal). */
  NEXT_PUBLIC_MODO_DEMONSTRACAO?: string;
}

const CHAVES = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const satisfies Record<keyof ConfigFirebase, keyof VariaveisFirebase>;

export type LeituraFirebase =
  { estado: "completa"; config: ConfigFirebase } | { estado: "ausente" } | { estado: "parcial"; faltando: string[] };

export function lerConfigFirebase(variaveis: VariaveisFirebase): LeituraFirebase {
  const valores = Object.fromEntries(
    Object.entries(CHAVES).map(([campo, variavel]) => [campo, variaveis[variavel]?.trim() ?? ""]),
  ) as Record<keyof ConfigFirebase, string>;
  const faltando = Object.entries(CHAVES)
    .filter(([campo]) => !valores[campo as keyof ConfigFirebase])
    .map(([, variavel]) => variavel);
  if (faltando.length === 0) return { estado: "completa", config: valores };
  if (faltando.length === Object.keys(CHAVES).length) return { estado: "ausente" };
  return { estado: "parcial", faltando };
}

export class ConfiguracaoDeDadosInvalida extends Error {
  override name = "ConfiguracaoDeDadosInvalida";
}

/**
 * De onde vêm os dados. Nunca cai em silêncio na demonstração em produção: as respostas
 * ficariam só no celular de cada convidado e os noivos não veriam nenhuma.
 * - Firebase completo → Firestore.
 * - Firebase pela metade → erro com as chaves que faltam (sempre).
 * - Sem Firebase → demonstração local em desenvolvimento, ou em produção só com
 *   NEXT_PUBLIC_MODO_DEMONSTRACAO=1.
 */
export function escolherOrigem(
  variaveis: VariaveisFirebase,
  producao: boolean,
): { origem: "firestore"; config: ConfigFirebase } | { origem: "local" } {
  const leitura = lerConfigFirebase(variaveis);
  if (leitura.estado === "completa") return { origem: "firestore", config: leitura.config };
  if (leitura.estado === "parcial") {
    throw new ConfiguracaoDeDadosInvalida(`Firebase configurado pela metade. Faltam: ${leitura.faltando.join(", ")}.`);
  }
  if (producao && variaveis.NEXT_PUBLIC_MODO_DEMONSTRACAO?.trim() !== "1") {
    throw new ConfiguracaoDeDadosInvalida(
      "Build de produção sem Firebase. Preencha as chaves NEXT_PUBLIC_FIREBASE_* ou, para uma demonstração, defina NEXT_PUBLIC_MODO_DEMONSTRACAO=1.",
    );
  }
  return { origem: "local" };
}

/**
 * As variáveis lidas uma a uma, por nome literal: o Next só embute no bundle do cliente
 * as `NEXT_PUBLIC_*` acessadas assim (não funciona com `process.env[nome]`).
 */
export function variaveisDoAmbiente(): VariaveisFirebase {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_MODO_DEMONSTRACAO: process.env.NEXT_PUBLIC_MODO_DEMONSTRACAO,
  };
}
