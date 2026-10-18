import type { Metadata } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { EsqueletoLista } from "@/components/convidados/EsqueletoLista";
import { LoginNoivos } from "@/components/convidados/LoginNoivos";
import { PainelConvidados } from "@/components/convidados/PainelConvidados";
import { textos } from "@/config/textos";
import { COOKIE_SESSAO, chaveDaSessao, sessaoValidaAgora } from "@/lib/api/sessao";
import { obterAmbiente } from "@/lib/db";
import { senhaVisivelNoLogin } from "@/lib/db/ambiente";

export const metadata: Metadata = {
  title: textos.convidados.titulo,
  // Área dos noivos: fora dos buscadores.
  robots: { index: false, follow: false },
};

/**
 * Decide no servidor: sem sessão, a porta (login); com sessão, o painel — que busca os dados
 * em `GET /api/convidados`. A proteção real é o 401 da rota; esta página não lê a lista.
 */
async function Porta() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  // Por pedido de verdade (nem o pré-carregamento parcial): a validade da sessão depende da hora atual.
  await connection();
  const ambiente = obterAmbiente();
  if (!sessaoValidaAgora(token, chaveDaSessao(ambiente.segredoSessao, ambiente.senhaNoivos))) {
    return <LoginNoivos senhaDeDemonstracao={senhaVisivelNoLogin(ambiente)} />;
  }
  return <PainelConvidados />;
}

export default function Convidados() {
  return (
    <Suspense fallback={<EsqueletoLista />}>
      <Porta />
    </Suspense>
  );
}
