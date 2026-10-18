/**
 * Demonstração sem backend: guarda em `localStorage` quando não há `.env.local` com o Firebase.
 *
 * - Propaga mudanças entre abas (evento `storage`) e dentro da mesma aba (aviso interno),
 *   para a lista de /convidados atualizar sozinha como no Firestore.
 * - `CHAVE_SIMULAR_FALHA` = "1" faz a próxima escrita falhar com `ErroDeRede` — usado pelos
 *   testes de "erro de rede" das Fases 5 e 6.
 */
import { esquemaConfirmacao, esquemaPresenteReservado, filtrarValidos, garantirGravavel } from "@/lib/schemas/dominio";
import type { Confirmacao, NovaConfirmacao, PresenteReservado } from "@/types/dominio";
import { ErroDeRede, type Cancelar, type Repositorios } from "./repositorio";

export const CHAVES_LOCAIS = {
  confirmacoes: "casamento:v1:confirmacoes",
  presentesReservados: "casamento:v1:presentes-reservados",
} as const;

export const CHAVE_SIMULAR_FALHA = "casamento:simular-falha";

type Armazenamento = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type AlvoDeEventos = Pick<Window, "addEventListener" | "removeEventListener">;

export interface OpcoesLocais {
  armazenamento: Armazenamento;
  /** `window`, para ouvir o evento `storage` de outras abas. Ausente em testes. */
  alvoDeEventos?: AlvoDeEventos;
  gerarId?: () => string;
  agora?: () => Date;
  /** Atraso artificial das escritas, para a demonstração mostrar o estado "carregando". */
  latenciaMs?: number;
}

function lerLista(armazenamento: Armazenamento, chave: string): unknown[] {
  try {
    const bruto = JSON.parse(armazenamento.getItem(chave) ?? "[]") as unknown;
    return Array.isArray(bruto) ? bruto : [];
  } catch {
    // JSON corrompido (alguém editou na mão): começa do zero em vez de quebrar a tela.
    return [];
  }
}

/**
 * `crypto.randomUUID` só existe em contexto seguro (https ou localhost). Abrindo a demonstração
 * pelo IP da rede local (http://192.168…), cai no `getRandomValues`, que existe em qualquer contexto.
 */
function gerarIdAleatorio(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

function esperar(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolver) => setTimeout(resolver, ms)) : Promise.resolve();
}

export function criarRepositoriosLocais({
  armazenamento,
  alvoDeEventos,
  gerarId = gerarIdAleatorio,
  agora = () => new Date(),
  latenciaMs = 0,
}: OpcoesLocais): Repositorios {
  const ouvintes = new Map<string, Set<() => void>>();

  function avisar(chave: string): void {
    for (const ouvinte of ouvintes.get(chave) ?? []) ouvinte();
  }

  function assinar(chave: string, ouvinte: () => void): Cancelar {
    const conjunto = ouvintes.get(chave) ?? new Set();
    conjunto.add(ouvinte);
    ouvintes.set(chave, conjunto);
    const aoMudarEmOutraAba = (evento: Event) => {
      // Checagem estrutural: `StorageEvent` não existe fora do navegador.
      if ("key" in evento && evento.key === chave) ouvinte();
    };
    alvoDeEventos?.addEventListener("storage", aoMudarEmOutraAba);
    return () => {
      conjunto.delete(ouvinte);
      alvoDeEventos?.removeEventListener("storage", aoMudarEmOutraAba);
    };
  }

  async function escrever(chave: string, item: object): Promise<void> {
    await esperar(latenciaMs);
    if (armazenamento.getItem(CHAVE_SIMULAR_FALHA) === "1") {
      armazenamento.removeItem(CHAVE_SIMULAR_FALHA);
      throw new ErroDeRede("Falha de rede simulada");
    }
    const lista = lerLista(armazenamento, chave);
    armazenamento.setItem(chave, JSON.stringify([...lista, item]));
    avisar(chave);
  }

  const confirmacoes = () => filtrarValidos(esquemaConfirmacao, lerLista(armazenamento, CHAVES_LOCAIS.confirmacoes));
  const reservados = () =>
    filtrarValidos(esquemaPresenteReservado, lerLista(armazenamento, CHAVES_LOCAIS.presentesReservados));

  return {
    origem: "local",
    confirmacoes: {
      listar: async () => confirmacoes(),
      observar(aoMudar) {
        aoMudar(confirmacoes());
        return assinar(CHAVES_LOCAIS.confirmacoes, () => aoMudar(confirmacoes()));
      },
      async registrar(nova: NovaConfirmacao): Promise<Confirmacao> {
        const registro = garantirGravavel(esquemaConfirmacao, { ...nova, id: gerarId(), criadoEm: agora() });
        await escrever(CHAVES_LOCAIS.confirmacoes, { ...registro, criadoEm: registro.criadoEm.toISOString() });
        return registro;
      },
    },
    presentes: {
      listarReservados: async () => reservados(),
      observarReservados(aoMudar) {
        aoMudar(reservados());
        return assinar(CHAVES_LOCAIS.presentesReservados, () => aoMudar(reservados()));
      },
      async reservar(presenteId: string): Promise<PresenteReservado> {
        const registro = garantirGravavel(esquemaPresenteReservado, { id: gerarId(), presenteId, criadoEm: agora() });
        await escrever(CHAVES_LOCAIS.presentesReservados, { ...registro, criadoEm: registro.criadoEm.toISOString() });
        return registro;
      },
    },
  };
}
