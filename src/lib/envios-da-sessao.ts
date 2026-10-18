/**
 * Limite simples contra spam no formulário de presença (briefing 6.4): poucos envios por aba,
 * contados no `sessionStorage`. O armazenamento entra como parâmetro (testável e tolerante a
 * navegador que bloqueia o storage) — sem ele, o limite do servidor continua valendo.
 */

export const ENVIOS_POR_SESSAO = 3;
const CHAVE = "convite:rsvp-envios";

type Armazenamento = Pick<Storage, "getItem" | "setItem">;

export function enviosFeitos(armazenamento: Armazenamento | null): number {
  try {
    return Number(armazenamento?.getItem(CHAVE) ?? "0") || 0;
  } catch {
    return 0;
  }
}

export function atingiuLimiteDeEnvios(armazenamento: Armazenamento | null): boolean {
  return enviosFeitos(armazenamento) >= ENVIOS_POR_SESSAO;
}

export function contarEnvio(armazenamento: Armazenamento | null): void {
  try {
    armazenamento?.setItem(CHAVE, String(enviosFeitos(armazenamento) + 1));
  } catch {
    // Storage bloqueado (modo privado antigo): sem contagem local.
  }
}

/** O `sessionStorage` do navegador, ou `null` onde acessá-lo lança. */
export function armazenamentoDaAba(): Armazenamento | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
