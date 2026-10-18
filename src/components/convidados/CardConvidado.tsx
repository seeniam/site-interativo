import { CalendarDays, Phone } from "lucide-react";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { textos } from "@/config/textos";
import { formatarDiaMes } from "@/lib/format";
import type { StatusResposta } from "@/types/dominio";

export interface CardConvidadoProps {
  nome: string;
  status: StatusResposta;
  /** Quem convidou: o nome da noiva ou do noivo. Vazio para quem não vem. */
  convidadoPor: string;
  confirmadoEm: Date;
  /** Telefone já no formato de exibição (mascarado ou não — quem decide é a lista). */
  telefone?: string;
  recado?: string;
  /** A pessoa mudou a resposta depois da primeira. */
  atualizada?: boolean;
  /** Nível do título na página onde o card aparece. */
  nivelTitulo?: "h2" | "h3" | "h4";
}

/** Linha da lista de quem confirmou, no celular (briefing 6.6). */
export function CardConvidado({
  nome,
  status,
  convidadoPor,
  confirmadoEm,
  telefone,
  recado,
  atualizada = false,
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
        {convidadoPor && (
          <div>
            <dt className="sr-only">{rotulos.convidadoPor}</dt>
            <dd>
              <span aria-hidden>{textos.convidados.prefixoConvidadoPor} </span>
              {convidadoPor}
            </dd>
          </div>
        )}
        <div>
          <dt className="sr-only">{rotulos.respondeuEm}</dt>
          <dd className="flex items-center gap-1.5 numeros">
            <CalendarDays aria-hidden size={15} strokeWidth={1.5} className="text-ouro-escuro" />
            <time dateTime={confirmadoEm.toISOString()}>{data}</time>
            {atualizada && <span className="text-12">({textos.convidados.mudouResposta})</span>}
          </dd>
        </div>
        {telefone && (
          <div>
            <dt className="sr-only">{textos.convidados.tabela.telefone}</dt>
            <dd className="flex items-center gap-1.5 numeros">
              <Phone aria-hidden size={14} strokeWidth={1.5} className="text-ouro-escuro" />
              <span data-telefone="">{telefone}</span>
            </dd>
          </div>
        )}
      </dl>

      {recado && (
        <p className="mt-3 border-l border-ouro pl-3 font-display text-16 text-tinta italic">
          <span className="sr-only">{textos.convidados.tabela.recado}: </span>
          {recado}
        </p>
      )}
    </article>
  );
}
