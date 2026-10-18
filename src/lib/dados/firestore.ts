/**
 * Implementação com Firestore (client SDK, sem servidor). O SDK é importado sob demanda:
 * quem nunca grava nem lê (a maioria das visitas ao convite) não baixa o Firebase.
 *
 * Coleções (briefing 5): `confirmacoes` e `presentes_reservados`, só de inclusão.
 * As regras de segurança estão em firestore.rules.
 */
import type { DocumentData, Firestore, QueryDocumentSnapshot } from "firebase/firestore";
import { esquemaConfirmacao, esquemaPresenteReservado, filtrarValidos, garantirGravavel } from "@/lib/schemas/dominio";
import type { Confirmacao, NovaConfirmacao, PresenteReservado } from "@/types/dominio";
import type { ConfigFirebase } from "./configuracao";
import { ErroDeRede, type Cancelar, type Repositorios } from "./repositorio";

const COLECOES = {
  confirmacoes: "confirmacoes",
  presentesReservados: "presentes_reservados",
} as const;

/**
 * Prazo de cada operação, contando o download do SDK. Sem cache persistente, o SDK espera o
 * servidor indefinidamente quando está offline; o prazo devolve o controle para a tela.
 */
const PRAZO_MS = 12_000;

let banco: Promise<Firestore> | null = null;

/** Inicializa uma vez. Se falhar, esquece a tentativa — o "Tentar de novo" começa do zero. */
function obterBanco(config: ConfigFirebase): Promise<Firestore> {
  banco ??= (async () => {
    const [{ getApps, initializeApp }, { getFirestore }] = await Promise.all([
      import("firebase/app"),
      import("firebase/firestore"),
    ]);
    const app = getApps()[0] ?? initializeApp(config);
    return getFirestore(app);
  })().catch((erro: unknown) => {
    banco = null;
    throw erro;
  });
  return banco;
}

/** Falha de rede, inclusive quando o próprio SDK não chegou a baixar (chunk do import dinâmico). */
export function paraErroDeRede(erro: unknown): Error {
  if (erro instanceof ErroDeRede) return erro;
  const codigo = typeof erro === "object" && erro !== null && "code" in erro ? String(erro.code) : "";
  if (["unavailable", "deadline-exceeded", "resource-exhausted"].includes(codigo)) {
    return new ErroDeRede(`Firestore: ${codigo}`);
  }
  const nome = erro instanceof Error ? erro.name : "";
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  if (
    nome === "ChunkLoadError" ||
    /dynamically imported module|Loading chunk|Failed to fetch|NetworkError/i.test(mensagem)
  ) {
    return new ErroDeRede(`Sem conexão: ${mensagem}`);
  }
  return erro instanceof Error ? erro : new Error(mensagem);
}

/** Roda a operação inteira (download do SDK incluído) com prazo, e traduz falha de rede. */
function comPrazo<T>(operacao: () => Promise<T>): Promise<T> {
  return new Promise((resolver, rejeitar) => {
    const relogio = setTimeout(() => rejeitar(new ErroDeRede("Sem resposta do servidor")), PRAZO_MS);
    operacao().then(
      (valor) => {
        clearTimeout(relogio);
        resolver(valor);
      },
      (erro: unknown) => {
        clearTimeout(relogio);
        rejeitar(paraErroDeRede(erro));
      },
    );
  });
}

/** Documento → objeto simples, com o Timestamp convertido (ainda estimado se a escrita é local). */
function paraObjeto(documento: QueryDocumentSnapshot<DocumentData>): unknown {
  const dados = documento.data({ serverTimestamps: "estimate" });
  const criadoEm: unknown = dados.criadoEm;
  const data =
    typeof criadoEm === "object" && criadoEm !== null && "toDate" in criadoEm && typeof criadoEm.toDate === "function"
      ? (criadoEm.toDate() as Date)
      : criadoEm;
  return { ...dados, id: documento.id, criadoEm: data };
}

export function criarRepositoriosFirestore(config: ConfigFirebase): Repositorios {
  function listar<T>(colecao: string, converter: (itens: unknown[]) => T[]): Promise<T[]> {
    return comPrazo(async () => {
      const { collection, getDocs } = await import("firebase/firestore");
      const resultado = await getDocs(collection(await obterBanco(config), colecao));
      return converter(resultado.docs.map(paraObjeto));
    });
  }

  function observar<T>(
    colecao: string,
    converter: (itens: unknown[]) => T[],
    aoMudar: (itens: T[]) => void,
    aoFalhar: (erro: Error) => void,
  ): Cancelar {
    let cancelar: Cancelar | null = null;
    let cancelado = false;
    void (async () => {
      try {
        const { collection, onSnapshot } = await import("firebase/firestore");
        const instancia = await obterBanco(config);
        if (cancelado) return;
        cancelar = onSnapshot(
          collection(instancia, colecao),
          (instantaneo) => aoMudar(converter(instantaneo.docs.map(paraObjeto))),
          (erro) => aoFalhar(paraErroDeRede(erro)),
        );
      } catch (erro) {
        if (!cancelado) aoFalhar(paraErroDeRede(erro));
      }
    })();
    return () => {
      cancelado = true;
      cancelar?.();
    };
  }

  function incluir(colecao: string, dados: Record<string, unknown>): Promise<{ id: string }> {
    return comPrazo(async () => {
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      return addDoc(collection(await obterBanco(config), colecao), { ...dados, criadoEm: serverTimestamp() });
    });
  }

  const converterConfirmacoes = (itens: unknown[]) => filtrarValidos(esquemaConfirmacao, itens);
  const converterReservados = (itens: unknown[]) => filtrarValidos(esquemaPresenteReservado, itens);

  return {
    origem: "firestore",
    confirmacoes: {
      listar: () => listar(COLECOES.confirmacoes, converterConfirmacoes),
      observar: (aoMudar, aoFalhar) => observar(COLECOES.confirmacoes, converterConfirmacoes, aoMudar, aoFalhar),
      async registrar(nova: NovaConfirmacao): Promise<Confirmacao> {
        // Confere com o esquema de leitura antes de gravar (id e data são provisórios aqui).
        const validado = garantirGravavel(esquemaConfirmacao, { ...nova, id: "provisorio", criadoEm: new Date() });
        const dados: NovaConfirmacao = {
          nome: validado.nome,
          telefone: validado.telefone,
          status: validado.status,
          acompanhantes: validado.acompanhantes,
          convidadoPor: validado.convidadoPor,
          recado: validado.recado,
        };
        const { id } = await incluir(COLECOES.confirmacoes, { ...dados, acompanhantes: [...dados.acompanhantes] });
        return { ...dados, id, criadoEm: new Date() };
      },
    },
    presentes: {
      listarReservados: () => listar(COLECOES.presentesReservados, converterReservados),
      observarReservados: (aoMudar, aoFalhar) =>
        observar(COLECOES.presentesReservados, converterReservados, aoMudar, aoFalhar),
      async reservar(presenteId: string): Promise<PresenteReservado> {
        garantirGravavel(esquemaPresenteReservado, { id: "provisorio", presenteId, criadoEm: new Date() });
        const { id } = await incluir(COLECOES.presentesReservados, { presenteId });
        return { id, presenteId, criadoEm: new Date() };
      },
    },
  };
}
