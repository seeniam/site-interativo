import { verificarRsvp } from "@/lib/api/rsvp";
import { limites, obterAmbiente, obterRepositorio } from "@/lib/api/servidor";

export async function POST(request: Request) {
  return verificarRsvp(request, {
    repositorio: obterRepositorio(),
    sal: obterAmbiente().sal,
    limitador: limites().verificar,
  });
}
