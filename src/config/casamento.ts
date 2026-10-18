/**
 * Fonte única de verdade do convite (briefing, seção 4).
 * Nenhum texto, preço, telefone ou data pode ficar escrito dentro de um componente.
 *
 * Vocabulário (briefing 4), igual em docs/PENDENCIAS.md:
 * - `pendente("...")` → "a definir": o dado ainda não existe; a interface mostra placeholder.
 * - `aConfirmar` (no fim) → "a confirmar": o dado chegou com dúvida. Hoje está vazio:
 *   o casal confirmou tudo em 17/10/2026.
 */
import { pendente } from "@/lib/pendente";
import type { ConfiguracaoCasamento } from "@/types/casamento";
import imagemCasal from "../../public/images/casal.jpeg";

const MAX_ACOMPANHANTES = 4;

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
    detalhe: {
      alt: "Detalhe das mãos do casal: a de Diorlando, com a aliança, na cintura de Jaqueline.",
      // Recorte fechado da mesma foto (briefing 3.7). Nesta foto a mão dela não mostra anel;
      // a aliança visível é a dele — o recorte fica nas duas mãos (DECISOES H3).
      posicao: "60% 43%",
      escala: 1.8,
    },
  },

  // Confirmado pelo casal: 21/12/2026, uma segunda-feira. Não é engano.
  data: "2026-12-21T16:30:00-03:00",
  horarioTexto: "a partir das 16h30",
  agenda: { duracaoHoras: 6 },

  local: {
    nome: "Espaço Max",
    endereco: "Av. Dois, 13 — Casa 5, Quadra, Itapiracó, São Luís — MA, 65054-866",
    enderecoCurto: "Chácara Itapiracó, São Luís — MA",
    mapsUrl: "https://maps.app.goo.gl/B53pcb3Xwk8eaSpu6",
    facebook: "https://www.facebook.com/458117960894623",
    // Confirmado: cerimônia e recepção no Espaço Max, a partir das 16h30.
    cerimoniaNoMesmoLocal: true,
  },

  versiculo: {
    texto: "E, acima de tudo, tenham amor, pois o amor une perfeitamente todas as coisas.",
    referencia: "Colossenses 3:14",
  },

  pix: {
    tipoChave: "telefone",
    chave: "98999676346",
    chaveFormatoBrCode: "+5598999676346",
    // Confirmado: 24 caracteres, cabe no limite de 25 do BR Code.
    nomeRecebedor: "JAQUELINE BARROS ALVARES",
    cidade: "SAO LUIS",
  },

  whatsapp: {
    // Confirmado: mesmo número da chave PIX.
    numero: "5598999676346",
    // Mensagem enviada pelo convidado no app dele, nunca renderizada no site (briefing 9).
    mensagemComprovante: "Oi! Acabei de enviar o presente de vocês 💛 Segue o comprovante:",
  },

  presentes: [
    {
      id: "bronze",
      tipo: "cota",
      titulo: "Cota Bronze",
      valor: 150,
      descricao: "",
      icone: "taca",
    },
    {
      id: "prata",
      tipo: "cota",
      titulo: "Cota Prata",
      valor: 200,
      descricao: "",
      icone: "alianca",
    },
    {
      id: "ouro",
      tipo: "cota",
      titulo: "Cota Ouro",
      valor: 250,
      descricao: "",
      icone: "presente",
      destaque: true,
    },
  ],

  historia: pendente("3 a 5 marcos de “nossa história” (ano, título e uma frase)"),

  trajes: {
    titulo: "Traje social",
    descricao: pendente("Orientação de traje"),
    paleta: [
      { hex: "#C9A227", nome: "Dourado" },
      { hex: "#FFFFFF", nome: "Branco" },
    ],
  },

  // Escrito a partir dos dados confirmados, sem fato novo (DECISOES V6).
  faq: [
    {
      pergunta: "O casamento é numa segunda-feira mesmo?",
      resposta:
        "É, sim. Dia 21 de dezembro de 2026 cai numa segunda-feira, e a data é essa mesma. Como é dia útil, vale se organizar com antecedência no trabalho.",
    },
    {
      pergunta: "A cerimônia e a festa são no mesmo lugar?",
      resposta:
        "São. Tudo acontece no Espaço Max, em São Luís, a partir das 16h30. O endereço completo e o mapa estão em “Quando e onde”.",
    },
    {
      pergunta: "Posso levar acompanhantes?",
      resposta: `Pode, até ${MAX_ACOMPANHANTES} por convite. Na confirmação de presença você escreve o nome de cada um.`,
    },
    {
      pergunta: "Como dou um presente?",
      resposta:
        "Escolha uma cota na lista de presentes e pague por PIX, lendo o QR Code ou copiando o código. Se puder, mande o comprovante pelo WhatsApp depois.",
    },
    {
      pergunta: "Até quando posso confirmar presença?",
      resposta: pendente("Prazo para confirmar presença"),
    },
  ],

  rsvp: {
    prazo: pendente("Prazo para confirmar presença"),
    maxAcompanhantes: MAX_ACOMPANHANTES,
  },

  aConfirmar: {},
} as const satisfies ConfiguracaoCasamento;
