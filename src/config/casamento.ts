/**
 * Fonte única de verdade do convite (briefing, seção 4).
 * Nenhum texto, preço, telefone ou data pode ficar escrito dentro de um componente.
 *
 * - `pendente("...")`: o cliente ainda não enviou — a interface mostra placeholder visível.
 * - Valores marcados com "a confirmar" foram enviados, mas têm dúvida aberta com o cliente.
 * As duas listas estão em docs/PENDENCIAS.md.
 */
import type { StaticImageData } from "next/image";
import type { NomeIconeMarca } from "@/components/brand/icons";
import { pendente, type Talvez } from "@/lib/pendente";
import imagemCasal from "../../public/images/casal.jpeg";

export interface Endereco {
  nome: string;
  endereco: string;
  /** Versão curta, para cards e para a agenda. */
  enderecoCurto: string;
  mapsUrl: string;
}

/**
 * Hoje cerimônia e recepção são no mesmo lugar (um card só).
 * Se mudar, `cerimoniaNoMesmoLocal: false` exige informar a cerimônia — e a página
 * passa a mostrar dois cards (briefing 6.1, item 5).
 */
export type Local = Endereco & { facebook?: string } & (
    { cerimoniaNoMesmoLocal: true } | { cerimoniaNoMesmoLocal: false; cerimonia: Endereco & { horarioTexto: string } }
  );

export interface MarcoHistoria {
  ano: Talvez<string>;
  titulo: Talvez<string>;
  texto: Talvez<string>;
  /** Caminho em /public. Enquanto não houver foto própria, a página usa `casamento.fotoCasal`. */
  foto: Talvez<string>;
}

export interface FotoGaleria {
  src: StaticImageData;
  alt: string;
}

export interface PerguntaFrequente {
  pergunta: Talvez<string>;
  resposta: Talvez<string>;
}

export interface Presente {
  id: string;
  tipo: "cota" | "nomeado";
  titulo: string;
  /** Em reais. */
  valor: number;
  descricao: Talvez<string>;
  /** Cada cota tem um ícone diferente — nunca o mesmo repetido (briefing 6.2). */
  icone: NomeIconeMarca;
  destaque?: boolean;
  foto?: StaticImageData;
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
  fotoCasal: { imagem: StaticImageData; alt: string };
  /** ISO 8601 com fuso de Brasília. */
  data: string;
  horarioTexto: string;
  local: Local;
  versiculo: { texto: string; referencia: string };
  pix: {
    /** Como o casal informou (telefone). */
    chave: string;
    /** Como entra no payload EMV, campo 01: +55, sem espaço, parênteses ou traço. */
    chaveFormatoBrCode: string;
    /** MAIÚSCULAS, sem acento, até 25 caracteres. */
    nomeRecebedor: string;
    /** MAIÚSCULAS, sem acento, até 15 caracteres. */
    cidade: string;
  };
  whatsapp: { numero: string; mensagemComprovante: string };
  presentes: readonly Presente[];
  historia: readonly MarcoHistoria[];
  galeria: Talvez<readonly FotoGaleria[]>;
  trajes: { titulo: string; descricao: Talvez<string>; paleta: readonly string[] };
  faq: readonly PerguntaFrequente[];
  rsvp: { prazo: Talvez<string>; maxAcompanhantes: number };
}

const marcoPendente = (n: number): MarcoHistoria => ({
  ano: pendente(`Ano do ${n}º marco da história`),
  titulo: pendente(`Título do ${n}º marco da história`),
  texto: pendente(`Frase do ${n}º marco da história`),
  foto: pendente(`Foto do ${n}º marco da história`),
});

const perguntaPendente = (n: number): PerguntaFrequente => ({
  pergunta: pendente(`Pergunta frequente ${n}`),
  resposta: pendente(`Resposta da pergunta ${n}`),
});

export const casamento = {
  noivos: {
    ela: "Jaqueline",
    ele: "Diorlando",
    titulo: "Jaqueline & Diorlando",
    monograma: { esquerda: "J", direita: "D" },
  },

  fotoCasal: {
    imagem: imagemCasal,
    alt: "Jaqueline e Diorlando abraçados num jardim à noite, iluminados por luzes quentes; ela de vestido azul-claro, ele de terno azul-marinho.",
  },

  // A confirmar: 21/12/2026 cai numa segunda-feira (PENDENCIAS C1).
  data: "2026-12-21T16:30:00-03:00",
  horarioTexto: "a partir das 16h30",

  local: {
    nome: "Espaço Max",
    endereco: "Av. Dois, 13 — Casa 5, Quadra, Itapiracó, São Luís — MA, 65054-866",
    enderecoCurto: "Chácara Itapiracó, São Luís — MA",
    mapsUrl: "https://maps.app.goo.gl/B53pcb3Xwk8eaSpu6",
    facebook: "https://www.facebook.com/458117960894623",
    // A confirmar: a cerimônia religiosa é no mesmo endereço? (PENDENCIAS C5)
    cerimoniaNoMesmoLocal: true,
  },

  versiculo: {
    texto: "E, acima de tudo, tenham amor, pois o amor une perfeitamente todas as coisas.",
    // O cliente escreveu 3.4; o texto corresponde a 3:14 (PENDENCIAS C6).
    referencia: "Colossenses 3:14",
  },

  pix: {
    chave: "98999676346",
    chaveFormatoBrCode: "+5598999676346",
    // A confirmar: nome completo como aparece no extrato (PENDENCIAS C3).
    nomeRecebedor: "JAQUELINE",
    cidade: "SAO LUIS",
  },

  whatsapp: {
    // A confirmar: é o mesmo número da chave PIX? (PENDENCIAS C4)
    numero: "5598999676346",
    // Mensagem enviada pelo convidado, fora da interface do site (ver DECISOES G7).
    mensagemComprovante: "Oi! Acabei de enviar o presente de vocês 💛 Segue o comprovante:",
  },

  // A confirmar: de-para valor × nome (PENDENCIAS C2).
  presentes: [
    {
      id: "bronze",
      tipo: "cota",
      titulo: "Cota Bronze",
      valor: 150,
      descricao: pendente("Frase do casal para a Cota Bronze"),
      icone: "taca",
    },
    {
      id: "prata",
      tipo: "cota",
      titulo: "Cota Prata",
      valor: 200,
      descricao: pendente("Frase do casal para a Cota Prata"),
      icone: "alianca",
    },
    {
      id: "ouro",
      tipo: "cota",
      titulo: "Cota Ouro",
      valor: 250,
      descricao: pendente("Frase do casal para a Cota Ouro"),
      icone: "presente",
      destaque: true,
    },
  ],

  historia: [marcoPendente(1), marcoPendente(2), marcoPendente(3)],
  galeria: pendente("6 a 10 fotos para a galeria"),

  trajes: {
    titulo: "Traje social",
    descricao: pendente("Orientação de traje"),
    paleta: ["#C9A227", "#FFFFFF"],
  },

  faq: [1, 2, 3, 4].map(perguntaPendente),

  rsvp: {
    prazo: pendente("Prazo para confirmar presença"),
    // A confirmar: limite de acompanhantes (PENDENCIAS C7).
    maxAcompanhantes: 4,
  },
} as const satisfies ConfiguracaoCasamento;
