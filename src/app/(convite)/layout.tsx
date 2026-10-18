import { BarraInferior } from "@/components/layout/BarraInferior";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { casamento } from "@/config/casamento";

/** Moldura das rotas do convite: cabeçalho (desktop), barra inferior (celular) e rodapé. */
export default function LayoutConvite({ children }: LayoutProps<"/">) {
  const { titulo } = casamento.noivos;
  return (
    <div className="com-barra-inferior flex min-h-dvh flex-col">
      <Cabecalho nomeDoCasal={titulo} />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Rodape nomeDoCasal={titulo} />
      <BarraInferior />
    </div>
  );
}
