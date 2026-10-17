import type { ReactNode } from "react";

interface SecaoProps {
  id: string;
  titulo: string;
  descricao: string;
  children: ReactNode;
}

/** Uma seção da referência: título, uma linha do que ela documenta, e as peças. */
export function Secao({ id, titulo, descricao, children }: SecaoProps) {
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} aria-labelledby={idTitulo} className="scroll-mt-8">
      <header className="mb-10 flex flex-col gap-3 sm:mb-12">
        <h2 id={idTitulo} className="font-display text-39 font-light text-tinta lg:text-49">
          {titulo}
        </h2>
        <p className="medida text-16 text-fumaca">{descricao}</p>
      </header>
      {children}
    </section>
  );
}

/** Rótulo de uma peça dentro da seção. */
export function Legenda({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-14 text-fumaca">{children}</p>;
}
