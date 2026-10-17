/**
 * Um dado que o cliente ainda não enviou.
 *
 * Em vez de string vazia ou comentário no código, o config guarda um valor tipado.
 * Todo componente que consome um campo `Talvez<T>` é obrigado pelo compilador a tratar
 * o caso pendente — e a interface mostra um placeholder honesto, nunca "undefined".
 * Cada `pendente(...)` corresponde a uma linha em docs/PENDENCIAS.md.
 */
export interface Pendente {
  readonly pendente: true;
  /** O que falta, na voz de quem lê o convite: "Data da cerimônia". */
  readonly descricao: string;
}

export type Talvez<T> = T | Pendente;

export function pendente(descricao: string): Pendente {
  return { pendente: true, descricao };
}

export function estaPendente<T>(valor: Talvez<T>): valor is Pendente {
  return (
    typeof valor === "object" &&
    valor !== null &&
    "pendente" in valor &&
    (valor as { pendente: unknown }).pendente === true
  );
}

/** Devolve o valor ou o substituto informado quando o dado ainda está pendente. */
export function ouSenao<T, S>(valor: Talvez<T>, substituto: S): T | S {
  return estaPendente(valor) ? substituto : valor;
}

/** Percorre qualquer estrutura e devolve todos os dados pendentes, na ordem em que aparecem. */
export function listarPendencias(valor: unknown): Pendente[] {
  if (estaPendente(valor)) return [valor];
  if (Array.isArray(valor)) return valor.flatMap(listarPendencias);
  if (typeof valor === "object" && valor !== null) return Object.values(valor).flatMap(listarPendencias);
  return [];
}
