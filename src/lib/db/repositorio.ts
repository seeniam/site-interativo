/**
 * Contrato da camada de dados. Só o servidor usa (Route Handlers e server components);
 * o navegador nunca fala com o banco (briefing 5).
 */
import type { Confirmacao, NovaConfirmacao } from "@/types/dominio";

export interface RegistroDeConfirmacao extends NovaConfirmacao {
  telefoneHash: string;
  atualizaDe: string | null;
}

export interface RepositorioCasamento {
  origem: "postgres" | "memoria";
  registrarConfirmacao(registro: RegistroDeConfirmacao): Promise<void>;
  /** Quando foi a resposta mais recente deste telefone (pelo hash) — ou null. Nada além disso. */
  ultimaRespostaDoHash(telefoneHash: string): Promise<Date | null>;
  /** Todas as linhas, da mais nova para a mais antiga. Só para a rota dos noivos. */
  listarConfirmacoes(): Promise<Confirmacao[]>;
  /** Ids dos presentes nomeados já dados. */
  listarReservados(): Promise<string[]>;
  /** Marca o presente; false se já estava marcado. */
  reservarPresente(presenteId: string): Promise<boolean>;
}
