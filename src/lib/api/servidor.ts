/**
 * Liga as Route Handlers ao repositório, ao ambiente e aos limites por IP. Só servidor.
 */
import "server-only";
import { obterAmbiente, obterRepositorio } from "@/lib/db";
import { criarLimitador } from "./limite";

const MINUTO = 60_000;

/** Contadores por instância do servidor, guardados no globalThis para sobreviver ao recarregamento em dev. */
const global = globalThis as typeof globalThis & { __casamentoLimites?: ReturnType<typeof criarLimites> };

function criarLimites() {
  return {
    /** Briefing 5: 3 envios por minuto. */
    rsvp: criarLimitador({ maximo: 3, janelaMs: MINUTO }),
    /** Chamado ao sair do campo de telefone; o limite impede que vire sonda de telefones. */
    verificar: criarLimitador({ maximo: 10, janelaMs: MINUTO }),
    reservar: criarLimitador({ maximo: 10, janelaMs: MINUTO }),
    /** A senha é a única porta: poucos chutes por minuto. */
    entrar: criarLimitador({ maximo: 5, janelaMs: MINUTO }),
  };
}

export function limites() {
  global.__casamentoLimites ??= criarLimites();
  return global.__casamentoLimites;
}

export { obterAmbiente, obterRepositorio };
