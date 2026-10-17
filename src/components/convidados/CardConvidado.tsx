import { CalendarDays, UsersRound } from "lucide-react";
import { SeloStatus, type StatusResposta } from "@/components/ui/SeloStatus";
import { textos } from "@/config/textos";
import { formatarDiaMes } from "@/lib/format";

export interface CardConvidadoProps {
  nome: string;
  status: StatusResposta;
  /** Quantas pessoas vêm junto (não conta o próprio convidado). */
  acompanhantes: number;
  /** Quem convidou: o nome da noiva ou do noivo. */
  convidadoPor: string;
  confirmadoEm: Date;
  /** Nível do título na página onde o card aparece. */
  nivelTitulo?: "h2" | "h3" | "h4";
}

/** Linha da lista de quem confirmou, no celular (briefing 6.6). */
export function CardConvidado({
  nome,
  status,
  acompanhantes,
  convidadoPor,
  confirmadoEm,
  nivelTitulo: Titulo = "h3",
}: CardConvidadoProps) {
  const data = formatarDiaMes(confirmadoEm);
  const { rotulos } = textos.convidados;

  return (
    <article className="rounded-card bg-branco px-5 py-4 ring-1 ring-borda">
      <div className="flex items-start justify-between gap-4">
        <Titulo className="min-w-0 text-16 font-normal break-words text-tinta">{nome}</Titulo>
        <div className="shrink-0 pt-0.5">
          <SeloStatus status={status} />
        </div>
      </div>

      <dl className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-14 text-fumaca">
        {status === "confirmado" && acompanhantes > 0 && (
          <div>
            <dt className="sr-only">{rotulos.acompanhantes}</dt>
            <dd className="flex items-center gap-1.5 numeros">
              <UsersRound aria-hidden size={15} strokeWidth={1.5} className="text-ouro" />+{acompanhantes}
            </dd>
          </div>
        )}
        <div>
          <dt className="sr-only">{rotulos.convidadoPor}</dt>
          <dd>
            <span aria-hidden>{textos.convidados.prefixoConvidadoPor} </span>
            {convidadoPor}
          </dd>
        </div>
        <div>
          <dt className="sr-only">{rotulos.respondeuEm}</dt>
          <dd className="flex items-center gap-1.5 numeros">
            <CalendarDays aria-hidden size={15} strokeWidth={1.5} className="text-ouro" />
            <time dateTime={confirmadoEm.toISOString()}>{data}</time>
          </dd>
        </div>
      </dl>
    </article>
  );
}
