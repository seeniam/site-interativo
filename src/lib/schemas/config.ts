/**
 * Validação do config do casamento. Pega na hora do teste o que o banco recusaria
 * (nome do recebedor longo, cidade com acento, chave sem +55) antes de chegar ao convidado.
 */
import { z } from "zod";
import { chaveNoFormato, LIMITE_CIDADE, LIMITE_NOME } from "@/lib/pix";

const TEXTO_PIX = /^[A-Z0-9 ]+$/;

export const esquemaConfig = z.object({
  noivos: z.object({
    ela: z.string().min(1),
    ele: z.string().min(1),
    titulo: z.string().min(1),
    monograma: z.object({ esquerda: z.string().length(1), direita: z.string().length(1) }),
  }),
  data: z.iso.datetime({ offset: true }),
  agenda: z.object({
    duracaoHoras: z.union([z.number().positive().max(24), z.object({ pendente: z.literal(true) })]),
  }),
  pix: z
    .object({
      tipoChave: z.enum(["telefone", "cpf", "cnpj", "email", "aleatoria"]),
      chave: z.string().min(1),
      chaveFormatoBrCode: z.string().min(1),
      nomeRecebedor: z.string().min(1).max(LIMITE_NOME).regex(TEXTO_PIX),
      cidade: z.string().min(1).max(LIMITE_CIDADE).regex(TEXTO_PIX),
    })
    .refine((pix) => chaveNoFormato(pix.tipoChave, pix.chaveFormatoBrCode), {
      error: "chaveFormatoBrCode fora do formato do tipo de chave (telefone: +55 + DDD + número)",
      path: ["chaveFormatoBrCode"],
    }),
  whatsapp: z.object({
    numero: z.string().regex(/^55\d{10,11}$/),
    mensagemComprovante: z.string().min(1),
  }),
  presentes: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        tipo: z.enum(["cota", "nomeado"]),
        titulo: z.string().min(1),
        valor: z.number().positive().multipleOf(0.01),
      }),
    )
    .min(1)
    .refine((lista) => new Set(lista.map((p) => p.id)).size === lista.length, { error: "ids de presente repetidos" }),
  trajes: z.object({ paleta: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)) }),
  rsvp: z.object({ maxAcompanhantes: z.number().int().min(0).max(10) }),
});
