import type { MetadataRoute } from "next";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { COR_PAPEL } from "@/lib/tokens";

export default function manifest(): MetadataRoute.Manifest {
  const { titulo, monograma } = casamento.noivos;
  return {
    name: titulo,
    short_name: `${monograma.esquerda} & ${monograma.direita}`,
    description: textos.metadados.descricao(titulo),
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: COR_PAPEL,
    theme_color: COR_PAPEL,
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
