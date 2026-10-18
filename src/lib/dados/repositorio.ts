/**
 * Contrato da camada de dados. As telas falam só com estas interfaces; quem guarda
 * (Firestore ou localStorage) é detalhe escolhido em `obterRepositorios`.
 */
import type { Confirmacao, NovaConfirmacao, PresenteReservado } from "@/types/dominio";

/** Falha de comunicação: os dados preenchidos ficam e a tela oferece "Tentar de novo". */
export class ErroDeRede extends Error {
  override name = "ErroDeRede";
}

export type Cancelar = () => void;

export interface RepositorioConfirmacoes {
  /** Todas as respostas registradas, inclusive as substituídas (histórico). */
  listar(): Promise<Confirmacao[]>;
  /** Avisa a cada mudança — inclusive vindas de outra aba ou de outro aparelho. */
  observar(aoMudar: (todas: Confirmacao[]) => void, aoFalhar: (erro: Error) => void): Cancelar;
  /** Inclui uma resposta nova. Nunca altera nem apaga (DECISOES F2). */
  registrar(nova: NovaConfirmacao): Promise<Confirmacao>;
}

export interface RepositorioPresentes {
  listarReservados(): Promise<PresenteReservado[]>;
  observarReservados(aoMudar: (todos: PresenteReservado[]) => void, aoFalhar: (erro: Error) => void): Cancelar;
  reservar(presenteId: string): Promise<PresenteReservado>;
}

export interface Repositorios {
  /** De onde vêm os dados — a interface avisa quando é a demonstração local. */
  origem: "firestore" | "local";
  confirmacoes: RepositorioConfirmacoes;
  presentes: RepositorioPresentes;
}
