import type { MetadataRoute } from "next";
import { urlDoSite } from "@/lib/site";

/** O convite pode ser achado; a lista dos noivos, a API e a página interna de design, não. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/convidados", "/api/", "/design-system"] },
    sitemap: new URL("/sitemap.xml", urlDoSite()).toString(),
  };
}
