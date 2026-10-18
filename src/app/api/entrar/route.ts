import { entrar } from "@/lib/api/noivos";
import { limites, obterAmbiente } from "@/lib/api/servidor";

export async function POST(request: Request) {
  const ambiente = obterAmbiente();
  return entrar(request, {
    senhaNoivos: ambiente.senhaNoivos,
    segredoSessao: ambiente.segredoSessao,
    limitador: limites().entrar,
    agora: Date.now,
  });
}
