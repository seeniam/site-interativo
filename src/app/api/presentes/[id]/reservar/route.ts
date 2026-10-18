import { PRESENTES } from "@/config/presentes";
import { reservarPresente } from "@/lib/api/presentes";
import { limites, obterRepositorio } from "@/lib/api/servidor";

export async function POST(request: Request, { params }: RouteContext<"/api/presentes/[id]/reservar">) {
  const { id } = await params;
  return reservarPresente(request, id, {
    repositorio: obterRepositorio(),
    presentes: PRESENTES,
    limitador: limites().reservar,
  });
}
