import { textos } from "@/config/textos";

export type StatusResposta = "confirmado" | "recusou";

/** Ponto + texto: o status nunca depende só da cor. */
export function SeloStatus({ status }: { status: StatusResposta }) {
  const cor = status === "confirmado" ? "text-sucesso" : "text-recusa";
  return (
    <span className={`inline-flex items-center gap-2 text-14 font-normal ${cor}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {textos.convidados.status[status]}
    </span>
  );
}
