import { NextResponse, type NextRequest } from "next/server";
import { IDS_DE_PRESENTES } from "@/config/presentes";

/**
 * Presente inexistente → 404 de verdade, decidido antes de renderizar.
 * Sem isto, a pré-renderização parcial já mandava a casca com 200 antes de a página chamar
 * `notFound()` (um "404 suave", com status inconsistente — DECISOES P5).
 */
function idDoCaminho(caminho: string): string {
  try {
    return decodeURIComponent(caminho.split("/")[2] ?? "");
  } catch {
    return ""; // "%E0%A4%A" e afins: endereço quebrado = presente inexistente (404, nunca 500).
  }
}

export function proxy(request: NextRequest) {
  if (IDS_DE_PRESENTES.includes(idDoCaminho(request.nextUrl.pathname))) return NextResponse.next();
  // Uma rota que não existe: o roteador responde com o not-found do site e status 404.
  return NextResponse.rewrite(new URL("/presente-inexistente", request.url));
}

export const config = {
  matcher: "/confirmar-presente/:id",
};
