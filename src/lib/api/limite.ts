/**
 * Limite por chave (IP) em janela deslizante, em memória — "em memória já basta" (briefing 5).
 * Cada instância do servidor tem o seu contador; é freio contra abuso, não garantia.
 */

export interface Limitador {
  /** Conta uma tentativa. `permitido: false` traz em quantos segundos tentar de novo. */
  tentar(chave: string): { permitido: true } | { permitido: false; tentarEmSegundos: number };
}

interface OpcoesLimitador {
  maximo: number;
  janelaMs: number;
  agora?: () => number;
  /** Teto de chaves guardadas; acima disso as mais antigas saem (memória não cresce sem fim). */
  maximoDeChaves?: number;
}

export function criarLimitador({
  maximo,
  janelaMs,
  agora = Date.now,
  maximoDeChaves = 10_000,
}: OpcoesLimitador): Limitador {
  const tentativas = new Map<string, number[]>();

  return {
    tentar(chave) {
      const instante = agora();
      const recentes = (tentativas.get(chave) ?? []).filter((t) => instante - t < janelaMs);
      if (recentes.length >= maximo) {
        tentativas.set(chave, recentes);
        const maisAntiga = recentes[0] ?? instante;
        return {
          permitido: false,
          tentarEmSegundos: Math.max(1, Math.ceil((maisAntiga + janelaMs - instante) / 1000)),
        };
      }
      recentes.push(instante);
      // Reinserir move a chave para o fim: a ordem do Map vira "menos recente primeiro".
      tentativas.delete(chave);
      tentativas.set(chave, recentes);
      while (tentativas.size > maximoDeChaves) {
        const maisVelha = tentativas.keys().next().value;
        if (maisVelha === undefined) break;
        tentativas.delete(maisVelha);
      }
      return { permitido: true };
    },
  };
}
