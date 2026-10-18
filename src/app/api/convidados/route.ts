import { connection } from "next/server";
import { listarConvidados } from "@/lib/api/noivos";
import { obterAmbiente, obterRepositorio } from "@/lib/api/servidor";

export async function GET(request: Request) {
  await connection();
  const ambiente = obterAmbiente();
  return listarConvidados(request, {
    repositorio: obterRepositorio(),
    segredoSessao: ambiente.segredoSessao,
    senhaNoivos: ambiente.senhaNoivos,
    agora: Date.now,
  });
}
