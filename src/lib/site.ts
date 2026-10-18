/**
 * Endereço público do site, para links absolutos (OG, sitemap, robots).
 * Na Vercel vem da variável de sistema `VERCEL_PROJECT_PRODUCTION_URL` (o domínio de produção,
 * preenchido pela própria plataforma) — não é segredo e não é mais uma variável para configurar.
 */
export function urlDoSite(): URL {
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return new URL(dominio ? `https://${dominio}` : "http://localhost:3000");
}
