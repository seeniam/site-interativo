import { ASSINATURA_EM_TRACOS, NOMES_EM_TRACOS } from "./monograma-glifos";

interface Trecho {
  viewBox: string;
  larguraEm: string | number;
  alturaEm: string | number;
  d: string;
}

/**
 * Texto desenhado com os contornos da própria fonte (DECISOES H10/H12): aparece na tipografia
 * certa no primeiro quadro, sem baixar a fonte. Mede-se em `em`, então segue o font-size de
 * quem o contém. Decorativo: o texto real fica num `sr-only` ao lado.
 */
function TextoEmTracos({ trecho, className = "" }: { trecho: Trecho; className?: string }) {
  return (
    <svg
      viewBox={trecho.viewBox}
      aria-hidden
      focusable={false}
      fill="currentColor"
      className={className}
      style={{ width: `${trecho.larguraEm}em`, height: `${trecho.alturaEm}em` }}
    >
      <path d={trecho.d} />
    </svg>
  );
}

/** Um nome do herói em contornos da Cormorant Light. */
export function NomeEmTracos({ quem, className }: { quem: keyof typeof NOMES_EM_TRACOS; className?: string }) {
  return <TextoEmTracos trecho={NOMES_EM_TRACOS[quem]} className={className} />;
}

/** Um trecho da assinatura do rodapé em contornos do Pinyon Script. */
export function AssinaturaEmTracos({
  parte,
  className,
}: {
  parte: keyof typeof ASSINATURA_EM_TRACOS;
  className?: string;
}) {
  return <TextoEmTracos trecho={ASSINATURA_EM_TRACOS[parte]} className={className} />;
}
