import { registrarRsvp } from "@/lib/api/rsvp";
import { limites, obterAmbiente, obterRepositorio } from "@/lib/api/servidor";

export async function POST(request: Request) {
  return registrarRsvp(request, {
    repositorio: obterRepositorio(),
    sal: obterAmbiente().sal,
    limitador: limites().rsvp,
  });
}
