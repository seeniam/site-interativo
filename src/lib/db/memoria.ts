/**
 * Adaptador em memória para a demonstração e o desenvolvimento sem banco (briefing 5).
 * Vive enquanto o processo do servidor vive; reiniciar zera e volta ao seed.
 */
import { esquemaRegistro, garantirGravavel } from "@/lib/schemas/dominio";
import type { Confirmacao } from "@/types/dominio";
import { hashTelefone } from "./hash";
import type { RegistroDeConfirmacao, RepositorioCasamento } from "./repositorio";

interface OpcoesMemoria {
  /** Confirmações iniciais (o seed da demonstração). */
  iniciais?: readonly Confirmacao[];
  agora?: () => Date;
}

export function criarRepositorioMemoria({
  iniciais = [],
  agora = () => new Date(),
}: OpcoesMemoria = {}): RepositorioCasamento {
  const confirmacoes: Confirmacao[] = [...iniciais];
  const reservados = new Map<string, Date>();
  let proximoId = confirmacoes.length + 1;

  return {
    origem: "memoria",

    async registrarConfirmacao(registro: RegistroDeConfirmacao) {
      const valido = garantirGravavel(esquemaRegistro, registro);
      confirmacoes.push({ ...valido, id: String(proximoId++), criadoEm: agora() });
    },

    async ultimaRespostaDoHash(telefoneHash) {
      const datas = confirmacoes.filter((c) => c.telefoneHash === telefoneHash).map((c) => c.criadoEm.getTime());
      return datas.length ? new Date(Math.max(...datas)) : null;
    },

    async listarConfirmacoes() {
      return [...confirmacoes].sort(
        (a, b) => b.criadoEm.getTime() - a.criadoEm.getTime() || Number(b.id) - Number(a.id),
      );
    },

    async listarReservados() {
      return [...reservados.keys()];
    },

    async reservarPresente(presenteId) {
      if (reservados.has(presenteId)) return false;
      reservados.set(presenteId, agora());
      return true;
    },
  };
}

/**
 * Seed da demonstração: 12 respostas com nomes claramente inventados e telefones no padrão
 * (98) 90000-00XX (briefing 5). As datas são relativas a `base` para a lista parecer viva.
 */
export function seedDemonstracao(sal: string, base: Date, convidadoPor: readonly [string, string]): Confirmacao[] {
  const [ela, ele] = convidadoPor;
  const pessoas: readonly [string, boolean, string, string][] = [
    ["Ana Exemplo da Silva", true, ela, "Que alegria! Estarei lá."],
    ["Carlos Fictício Souza", true, ele, ""],
    ["Dora Demonstração", true, ela, "Não perco por nada."],
    ["Gustavo Modelo Lima", false, ele, "Infelizmente vou estar viajando. Felicidades!"],
    ["Helena Teste Rocha", true, ela, ""],
    ["Júlia Inventada Costa", true, ela, "Mal posso esperar!"],
    ["Kauã Exemplar Dias", false, ele, ""],
    ["Laura Amostra Nunes", true, ele, ""],
    ["Nina Protótipo Melo", true, ela, "Contem comigo para a pista."],
    ["Otávio Simulado Reis", true, ele, ""],
    ["Sara Fictícia Alves", false, ela, "Estarei com vocês em pensamento."],
    ["Tiago Exemplo Prado", true, ele, ""],
  ];
  return pessoas.map(([nome, vai, convidou, recado], i) => {
    const telefone = `989000000${String(i + 1).padStart(2, "0")}`;
    return {
      id: String(i + 1),
      nome,
      telefone,
      telefoneHash: hashTelefone(telefone, sal),
      status: vai ? "confirmado" : "recusou",
      convidadoPor: vai ? convidou : "",
      recado,
      atualizaDe: null,
      criadoEm: new Date(base.getTime() - (pessoas.length - i) * 7 * 3_600_000),
    };
  });
}
