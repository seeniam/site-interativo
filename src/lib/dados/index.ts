/**
 * Ponto de entrada da camada de dados, só no navegador.
 * A origem (Firestore ou demonstração local) é decidida por `escolherOrigem` — nunca em silêncio.
 */
import { escolherOrigem, variaveisDoAmbiente } from "./configuracao";
import { criarRepositoriosFirestore } from "./firestore";
import { criarRepositoriosLocais } from "./local";
import type { Repositorios } from "./repositorio";

export type { Repositorios } from "./repositorio";
export { ErroDeRede } from "./repositorio";
export { respostasVigentes, respostaVigenteDoTelefone } from "./regras";

/** Atraso das escritas na demonstração: o suficiente para ver o estado "Enviando…". */
const LATENCIA_DEMONSTRACAO_MS = 450;

let instancia: Repositorios | null = null;

export function obterRepositorios(): Repositorios {
  if (typeof window === "undefined") {
    throw new Error("A camada de dados roda só no navegador (client components).");
  }
  if (instancia) return instancia;
  const escolha = escolherOrigem(variaveisDoAmbiente(), process.env.NODE_ENV === "production");
  instancia =
    escolha.origem === "firestore"
      ? criarRepositoriosFirestore(escolha.config)
      : criarRepositoriosLocais({
          armazenamento: window.localStorage,
          alvoDeEventos: window,
          latenciaMs: LATENCIA_DEMONSTRACAO_MS,
        });
  return instancia;
}
