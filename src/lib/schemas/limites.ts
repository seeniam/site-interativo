/**
 * Limites de tamanho, num lugar só. O formulário, a leitura do armazenamento e
 * firestore.rules usam os mesmos números — se divergirem, uma resposta pode ser gravada
 * e depois descartada na leitura, sumindo sem aviso. `scripts/regras-firestore.test.ts`
 * confere que as regras batem com este arquivo.
 */
export const LIMITES = {
  nome: 120,
  /** Teto técnico de itens; o limite real por convidado vem de `casamento.rsvp.maxAcompanhantes`. */
  acompanhantes: 10,
  nomeAcompanhante: 120,
  convidadoPor: 60,
  recado: 240,
  presenteId: 40,
} as const;
