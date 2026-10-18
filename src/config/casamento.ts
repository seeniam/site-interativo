/**
 * Fonte única de verdade do convite (briefing, seção 4).
 * Nenhum texto, preço, telefone ou data pode ficar escrito dentro de um componente.
 *
 * - `pendente("...")`: o cliente ainda não enviou — a interface mostra placeholder visível.
 * - `aConfirmar` (no fim): valores que chegaram, mas têm dúvida aberta com o cliente.
 * Vocabulário do briefing 4: "a definir" = não existe; "a confirmar" = chegou com dúvida.
 * As duas listas estão em docs/PENDENCIAS.md.
 */
import { pendente } from "@/lib/pendente";
import type { ConfiguracaoCasamento, MarcoHistoria, PerguntaFrequente } from "@/types/casamento";
import imagemCasal from "../../public/images/casal.jpeg";

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

  data: "2026-12-21T16:30:00-03:00",
  horarioTexto: "a partir das 16h30",
  agenda: { duracaoHoras: pendente("Horário de término da festa") },

  local: {
    nome: "Espaço Max",
    endereco: "Av. Dois, 13 — Casa 5, Quadra, Itapiracó, São Luís — MA, 65054-866",
    enderecoCurto: "Chácara Itapiracó, São Luís — MA",
    mapsUrl: "https://maps.app.goo.gl/B53pcb3Xwk8eaSpu6",
    facebook: "https://www.facebook.com/458117960894623",
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
    nomeRecebedor: "JAQUELINE",
    cidade: "SAO LUIS",
  },

  whatsapp: {
    numero: "5598999676346",
    // Mensagem enviada pelo convidado, fora da interface do site (ver DECISOES G7).
    mensagemComprovante: "Oi! Acabei de enviar o presente de vocês 💛 Segue o comprovante:",
  },

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
    maxAcompanhantes: 4,
  },

  aConfirmar: {
    data: "21/12/2026 cai numa segunda-feira. O ano é 2026 mesmo?",
    "presentes.valores": "Bronze R$ 150, Prata R$ 200, Ouro R$ 250? A ordem enviada invertia Bronze e Prata.",
    "pix.nomeRecebedor": "Nome do recebedor exatamente como aparece no extrato do banco (até 25 caracteres).",
    "whatsapp.numero": "O WhatsApp para comprovantes é o mesmo número da chave PIX?",
    "local.cerimoniaNoMesmoLocal": "A cerimônia religiosa é no Espaço Max ou em outro endereço e horário?",
    "versiculo.referencia": "Foi enviado “3.4”; o texto corresponde a Colossenses 3:14.",
    "rsvp.maxAcompanhantes": "Limite de 4 acompanhantes por convidado.",
  },
} as const satisfies ConfiguracaoCasamento;
