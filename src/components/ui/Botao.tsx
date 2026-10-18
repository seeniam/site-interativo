import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

/** "claro": contorno sobre a foto escura do herói (texto branco, filete ouro-claro — DECISOES H5). */
type Variante = "primario" | "contorno" | "texto" | "claro";
type Tamanho = "padrao" | "grande";

interface Aparencia {
  variante?: Variante;
  tamanho?: Tamanho;
  /** Ocupa a largura toda (botões de formulário no celular). */
  bloco?: boolean;
}

export function classesBotao({ variante = "primario", tamanho = "padrao", bloco = false }: Aparencia, extra = "") {
  return ["botao", `botao--${variante}`, tamanho === "grande" && "botao--grande", bloco && "botao--bloco", extra]
    .filter(Boolean)
    .join(" ");
}

type BotaoProps = Aparencia &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Mostra o girador e bloqueia novo clique, sem tirar o foco do botão. */
    carregando?: boolean;
    /** O que o botão diz enquanto carrega: "Enviando…". */
    textoCarregando?: string;
    icone?: ReactNode;
    /** Força a aparência de um estado — só para o /design-system. */
    "data-estado"?: "hover" | "foco" | "pressionado";
  };

export function Botao({
  variante,
  tamanho,
  bloco,
  carregando = false,
  textoCarregando,
  icone,
  className,
  children,
  type = "button",
  onClick,
  ...resto
}: BotaoProps) {
  return (
    <button
      // Carregando, deixa de ser submit: nem clique nem Enter reenviam o formulário,
      // e o foco continua no botão (diferente de `disabled`).
      type={carregando ? "button" : type}
      className={classesBotao({ variante, tamanho, bloco }, className)}
      aria-busy={carregando || undefined}
      aria-disabled={carregando || undefined}
      onClick={carregando ? undefined : onClick}
      {...resto}
    >
      {carregando ? <span aria-hidden className="botao__girador" /> : icone}
      <span>{carregando && textoCarregando ? textoCarregando : children}</span>
    </button>
  );
}

type BotaoLinkProps = Aparencia &
  ComponentProps<typeof Link> & {
    icone?: ReactNode;
  };

/** Navegação com cara de botão. O texto diz para onde vai: "Confirmar presença". */
export function BotaoLink({ variante, tamanho, bloco, icone, className, children, ...resto }: BotaoLinkProps) {
  return (
    <Link className={classesBotao({ variante, tamanho, bloco }, className)} {...resto}>
      {icone}
      <span>{children}</span>
    </Link>
  );
}
