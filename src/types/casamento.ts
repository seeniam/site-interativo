/**
 * Forma do conteúdo editável do convite (`src/config/casamento.ts`).
 * Campos `Talvez<T>` podem estar "a definir" (o casal ainda não enviou).
 */
import type { StaticImageData } from "next/image";
import type { NomeIconeMarca } from "@/components/brand/icons";
import type { Talvez } from "@/lib/pendente";

export interface Endereco {
  nome: string;
  endereco: string;
  /** Versão curta, para cards e para a agenda. */
  enderecoCurto: string;
  mapsUrl: string;
}

/**
 * União discriminada: com `cerimoniaNoMesmoLocal: false`, o compilador exige os dados da
 * cerimônia — trocar a flag sem informá-los é erro de tipo, não erro em produção.
 * A página mostra um card ou dois conforme a flag (briefing 6.1, item 5).
 */
export type Local = Endereco & { facebook?: string } & (
    { cerimoniaNoMesmoLocal: true } | { cerimoniaNoMesmoLocal: false; cerimonia: Endereco & { horarioTexto: string } }
  );

/** Um marco de "nossa história" — só texto (não há outras fotos, briefing 3.7). */
export interface MarcoHistoria {
  ano: string;
  titulo: string;
  texto: string;
}

export interface PerguntaFrequente {
  pergunta: string;
  /** Pode estar "a definir" quando depende de um dado que o casal ainda não enviou. */
  resposta: Talvez<string>;
}

export type TipoPresente = "cota" | "nomeado";

export interface Presente {
  id: string;
  tipo: TipoPresente;
  titulo: string;
  /** Em reais. */
  valor: number;
  descricao: Talvez<string>;
  /** Cada cota tem um ícone diferente — nunca o mesmo repetido (briefing 6.2). */
  icone: NomeIconeMarca;
  destaque?: boolean;
  foto?: StaticImageData;
}

/** Tipos de chave PIX aceitos pelo Banco Central. */
export type TipoChavePix = "telefone" | "cpf" | "cnpj" | "email" | "aleatoria";

export interface DadosPixRecebedor {
  tipoChave: TipoChavePix;
  /** Como o casal informou. */
  chave: string;
  /** Como entra no payload EMV, campo 01. Telefone: +55, sem espaço, parênteses ou traço. */
  chaveFormatoBrCode: string;
  /** MAIÚSCULAS, sem acento, até 25 caracteres. */
  nomeRecebedor: string;
  /** MAIÚSCULAS, sem acento, até 15 caracteres. */
  cidade: string;
}

/**
 * Campos que chegaram do cliente mas têm dúvida aberta — "a confirmar" (briefing 4).
 * Cada um corresponde a uma linha C# em docs/PENDENCIAS.md.
 */
export type CampoAConfirmar =
  | "data"
  | "presentes.valores"
  | "pix.nomeRecebedor"
  | "whatsapp.numero"
  | "local.cerimoniaNoMesmoLocal"
  | "versiculo.referencia";

/** A foto única do casal, usada só no herói (DECISOES A3). */
export interface FotoCasal {
  imagem: StaticImageData;
  alt: string;
}

export interface ConfiguracaoCasamento {
  noivos: {
    ela: string;
    ele: string;
    /** Sempre "Jaqueline & Diorlando", ela primeiro: herói, <title>, OG, rodapé, WhatsApp. */
    titulo: string;
    /** Letras do monograma. O "&" entre elas é o glifo do Pinyon Script. */
    monograma: { esquerda: string; direita: string };
    /** Opcional: só se quiserem os sobrenomes no rodapé. */
    sobrenomes?: { ela: string; ele: string };
  };
  /** Importada estaticamente: dá dimensões e blur automático ao next/image. */
  fotoCasal: FotoCasal;
  /** ISO 8601 com fuso de Brasília. */
  data: string;
  horarioTexto: string;
  /** Padrão técnico (DECISOES V7): o cliente informou só o início; a agenda precisa de término. */
  agenda: { duracaoHoras: number };
  local: Local;
  versiculo: { texto: string; referencia: string };
  pix: DadosPixRecebedor;
  whatsapp: { numero: string; mensagemComprovante: string };
  presentes: readonly Presente[];
  /** "A definir": sem os marcos, a seção inteira não é renderizada (briefing 6.1). */
  historia: Talvez<readonly MarcoHistoria[]>;
  trajes: { titulo: string; orientacao: string };
  faq: readonly PerguntaFrequente[];
  rsvp: { prazo: Talvez<string> };
  /** O motivo de cada dúvida, na voz de quem vai perguntar ao casal. */
  aConfirmar: Readonly<Partial<Record<CampoAConfirmar, string>>>;
}
