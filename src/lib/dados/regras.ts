/**
 * Regras sobre as respostas, independentes de onde estão guardadas.
 * Como as confirmações são só de inclusão (DECISOES F2), a resposta que vale para cada
 * telefone é a mais recente.
 */
import type { Confirmacao } from "@/types/dominio";

/** Uma resposta por telefone — a mais recente —, da mais nova para a mais antiga. */
export function respostasVigentes(todas: readonly Confirmacao[]): Confirmacao[] {
  const porTelefone = new Map<string, Confirmacao>();
  for (const resposta of todas) {
    const atual = porTelefone.get(resposta.telefone);
    if (!atual || resposta.criadoEm.getTime() > atual.criadoEm.getTime()) {
      porTelefone.set(resposta.telefone, resposta);
    }
  }
  return [...porTelefone.values()].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
}

/** A resposta que vale para este telefone, para o aviso "Você já confirmou em 00/00". */
export function respostaVigenteDoTelefone(todas: readonly Confirmacao[], telefone: string): Confirmacao | null {
  return respostasVigentes(todas.filter((c) => c.telefone === telefone))[0] ?? null;
}
