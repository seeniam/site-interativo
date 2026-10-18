import { connection } from "next/server";
import { listarConvidados } from "@/lib/api/noivos";
import { obterAmbiente, obterRepositorio } from "@/lib/api/servidor";

export async function GET(request: Request) {
  await connection();
  return listarConvidados(request, {
    repositorio: obterRepositorio(),
    segredoSessao: obterAmbiente().segredoSessao,
    agora: Date.now,
  });
}
