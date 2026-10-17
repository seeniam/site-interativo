import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";

/** Display: nomes dos noivos, títulos de seção, números. */
export const cormorant = Cormorant_Garamond({
  weight: ["300", "400"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-cormorant",
});

/** Interface: todo o resto. */
export const jost = Jost({
  weight: ["300", "400", "500"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-jost",
});

/**
 * Assinatura: somente o "&" e a assinatura do rodapé.
 * Sem preload — o monograma usa contornos em SVG e não depende desta fonte.
 */
export const pinyon = Pinyon_Script({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  variable: "--font-pinyon",
});
