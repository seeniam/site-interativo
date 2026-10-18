import { Cormorant_Garamond, Jost } from "next/font/google";

/*
 * Fontes variáveis: um arquivo por estilo em vez de um por peso (briefing 8, Lighthouse).
 * O Pinyon Script não é baixado: o "&" e a assinatura do rodapé — seus únicos usos (3.3) —
 * são contornos SVG da própria fonte (DECISOES H12).
 */

/**
 * Display: títulos de seção, números. Sem preload: os nomes do herói são contornos SVG
 * (DECISOES H10), e o resto da Cormorant não disputa a banda com a primeira dobra.
 */
export const cormorant = Cormorant_Garamond({
  style: "normal",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  variable: "--font-cormorant",
});

/**
 * O versículo do herói em itálico: é o maior texto da primeira dobra (o elemento do LCP),
 * então é pré-carregado — só o itálico, subset latino (DECISOES H11).
 */
export const cormorantItalico = Cormorant_Garamond({
  style: "italic",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant-italico",
});

/** Interface: todo o resto. Pré-carregada: está nos botões e na data da primeira dobra. */
export const jost = Jost({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-jost",
});
