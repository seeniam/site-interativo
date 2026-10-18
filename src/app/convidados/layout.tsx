import Link from "next/link";
import { Monograma } from "@/components/brand/Monograma";
import { textos } from "@/config/textos";

/**
 * Moldura da área dos noivos: sem a navegação do convidado (barra inferior e cabeçalho do
 * convite) — aqui é uma ferramenta, não o convite.
 */
export default function LayoutConvidados({ children }: LayoutProps<"/convidados">) {
  return (
    <div className="flex min-h-dvh flex-col bg-papel">
      <header className="conteiner flex items-center justify-between py-5">
        <Link href="/" aria-label={textos.convidados.voltarAoConvite} className="rounded-sm">
          <Monograma decorativo className="h-10 w-auto" />
        </Link>
      </header>
      <main id="conteudo" tabIndex={-1} className="flex-1 pb-16 outline-none">
        {children}
      </main>
    </div>
  );
}
