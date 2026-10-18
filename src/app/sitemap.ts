import type { MetadataRoute } from "next";
import { urlDoSite } from "@/lib/site";

/** Só as páginas públicas do convite (sem /convidados, /agradecimento e as telas de PIX). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlDoSite();
  return [
    { url: new URL("/", base).toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/presentear", base).toString(), changeFrequency: "monthly", priority: 0.8 },
    { url: new URL("/confirmar-presenca", base).toString(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
