/**
 * PIX "copia e cola" / QR estático no padrão BR Code (EMV MPM), gerado no cliente.
 * Referência: Manual de Padrões para Iniciação do Pix (Banco Central do Brasil).
 *
 * `gerarPayloadPix` é pura e não altera o texto recebido: valida e recusa o que estiver fora
 * do padrão. A normalização (maiúsculas, sem acento) é de `normalizarCampoPix` (DECISOES F6).
 */
import type { DadosPixRecebedor, Presente, TipoChavePix } from "@/types/casamento";

export const LIMITE_NOME = 25;
export const LIMITE_CIDADE = 15;
export const LIMITE_TXID = 25;
const LIMITE_VALOR = 9_999_999_999.99;

/** IDs dos campos EMV usados (tabela do manual do BC). */
const ID = {
  formato: "00",
  contaRecebedor: "26",
  gui: "00",
  chave: "01",
  categoria: "52",
  moeda: "53",
  valor: "54",
  pais: "58",
  nome: "59",
  cidade: "60",
  adicionais: "62",
  txid: "05",
  crc: "63",
} as const;

export class ErroPix extends Error {
  override name = "ErroPix";
}

export interface DadosPix {
  tipoChave: TipoChavePix;
  /** Já no formato do BR Code (telefone com +55). */
  chave: string;
  nome: string;
  cidade: string;
  /** Em reais. Sem valor, quem paga digita. */
  valor?: number;
  /** Identificador alfanumérico (até 25). Sem txid, vai "***" (QR estático). */
  txid?: string;
}

/** Campo EMV: ID (2) + tamanho (2, com zero à esquerda) + valor. */
function campo(id: string, valor: string): string {
  if (valor.length > 99) throw new ErroPix(`Campo ${id} passa de 99 caracteres`);
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

/**
 * CRC16-CCITT-FALSE: polinômio 0x1021, valor inicial 0xFFFF, sem reflexão, sem XOR final.
 * Devolve 4 dígitos hexadecimais em maiúsculas.
 */
export function crc16Ccitt(texto: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Maiúsculas, sem acento, só letras, números e espaço simples. */
export function normalizarCampoPix(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ASCII_IMPRIMIVEL = /^[\x20-\x7E]+$/;

const FORMATO_CHAVE: Record<TipoChavePix, { regex: RegExp; dica: string }> = {
  telefone: {
    regex: /^\+55\d{10,11}$/,
    dica: "Chave de telefone vai como +55 + DDD + número, sem espaço nem traço (ex.: +5598999676346).",
  },
  cpf: { regex: /^\d{11}$/, dica: "CPF: 11 dígitos, sem ponto nem traço." },
  cnpj: { regex: /^\d{14}$/, dica: "CNPJ: 14 dígitos, sem ponto, barra nem traço." },
  email: {
    // Só ASCII e minúsculas: no EMV o tamanho conta caracteres, e o CRC, bytes.
    regex:
      /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/,
    dica: "E-mail em minúsculas, sem acento, até 77 caracteres.",
  },
  aleatoria: {
    regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    dica: "Chave aleatória: UUID em minúsculas (8-4-4-4-12).",
  },
};

const LIMITE_EMAIL = 77;

/** A chave está no formato que entra no BR Code para este tipo? (usado também pelo esquema do config) */
export function chaveNoFormato(tipo: TipoChavePix, chave: string): boolean {
  if (!ASCII_IMPRIMIVEL.test(chave)) return false;
  if (tipo === "email" && chave.length > LIMITE_EMAIL) return false;
  return FORMATO_CHAVE[tipo].regex.test(chave);
}

function validarChave(tipo: TipoChavePix, chave: string): void {
  if (!chaveNoFormato(tipo, chave)) {
    throw new ErroPix(`Chave PIX (${tipo}) fora do formato. ${FORMATO_CHAVE[tipo].dica}`);
  }
}

function validarTexto(rotulo: string, texto: string, limite: number): void {
  if (texto.length === 0) throw new ErroPix(`${rotulo} vazio`);
  if (texto.length > limite) throw new ErroPix(`${rotulo} passa de ${limite} caracteres: "${texto}"`);
  if (!ASCII_IMPRIMIVEL.test(texto)) throw new ErroPix(`${rotulo} tem acento ou caractere especial: "${texto}"`);
}

/**
 * Trabalha em centavos inteiros: recusa fração de centavo em vez de arredondar em silêncio
 * (0,004 viraria "0.00"; 99,999 viraria "100.00").
 */
function formatarValor(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0 || valor > LIMITE_VALOR) {
    throw new ErroPix(`Valor inválido para PIX: ${valor}`);
  }
  const centavos = Math.round(valor * 100);
  if (Math.abs(centavos - valor * 100) > 1e-6) {
    throw new ErroPix(`Valor com fração de centavo: ${valor}`);
  }
  return `${Math.trunc(centavos / 100)}.${String(centavos % 100).padStart(2, "0")}`;
}

function validarTxid(txid: string): void {
  if (txid !== "***" && !/^[A-Za-z0-9]{1,25}$/.test(txid)) {
    throw new ErroPix(`txid deve ter de 1 a ${LIMITE_TXID} letras ou números: "${txid}"`);
  }
}

/** Monta o payload "copia e cola" completo, já com o CRC. */
export function gerarPayloadPix({ tipoChave, chave, nome, cidade, valor, txid = "***" }: DadosPix): string {
  validarChave(tipoChave, chave);
  validarTexto("Nome do recebedor", nome, LIMITE_NOME);
  validarTexto("Cidade", cidade, LIMITE_CIDADE);
  validarTxid(txid);

  const corpo = [
    campo(ID.formato, "01"),
    campo(ID.contaRecebedor, campo(ID.gui, "br.gov.bcb.pix") + campo(ID.chave, chave)),
    campo(ID.categoria, "0000"),
    campo(ID.moeda, "986"),
    valor === undefined ? "" : campo(ID.valor, formatarValor(valor)),
    campo(ID.pais, "BR"),
    campo(ID.nome, nome),
    campo(ID.cidade, cidade),
    campo(ID.adicionais, campo(ID.txid, txid)),
  ].join("");

  // O CRC cobre tudo até "6304", inclusive.
  const semCrc = `${corpo}${ID.crc}04`;
  return semCrc + crc16Ccitt(semCrc);
}

/** txid a partir do id do presente: "ouro" → "OURO". Aparece no extrato do casal. */
export function txidDoPresente(presente: Pick<Presente, "id">): string {
  return (
    presente.id
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, LIMITE_TXID) || "***"
  );
}

/** O PIX de um presente da lista, com os dados do recebedor vindos do config. */
export function payloadPixDoPresente(recebedor: DadosPixRecebedor, presente: Pick<Presente, "id" | "valor">): string {
  return gerarPayloadPix({
    tipoChave: recebedor.tipoChave,
    chave: recebedor.chaveFormatoBrCode,
    nome: normalizarCampoPix(recebedor.nomeRecebedor),
    cidade: normalizarCampoPix(recebedor.cidade),
    valor: presente.valor,
    txid: txidDoPresente(presente),
  });
}

/** Lê os campos de primeiro nível de um payload (útil em teste e depuração). */
export function lerCamposPix(payload: string): Map<string, string> {
  const campos = new Map<string, string>();
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const tamanho = Number(payload.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || Number.isNaN(tamanho)) throw new ErroPix(`Payload malformado na posição ${i}`);
    campos.set(id, payload.slice(i + 4, i + 4 + tamanho));
    i += 4 + tamanho;
  }
  return campos;
}

/** Confere se o CRC no fim do payload bate com o conteúdo. */
export function crcConfere(payload: string): boolean {
  if (payload.length < 8) return false;
  return crc16Ccitt(payload.slice(0, -4)) === payload.slice(-4);
}
