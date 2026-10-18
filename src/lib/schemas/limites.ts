/**
 * Limites de tamanho, num lugar só. O formulário (cliente e servidor) e a leitura do banco
 * usam os mesmos números — se divergirem, uma resposta pode ser gravada e depois descartada
 * na leitura, sumindo sem aviso. Um teste de propriedade em schemas.test.ts confere isso.
 */
export const LIMITES = {
  nome: 120,
  convidadoPor: 60,
  recado: 240,
  presenteId: 40,
} as const;
