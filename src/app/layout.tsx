import type { Metadata, Viewport } from "next";
import { MonogramaSprite } from "@/components/brand/MonogramaSprite";
import { SCRIPT_ABERTURA } from "@/components/layout/AberturaConvite";
import { NotificacoesPreguicosas } from "@/components/layout/NotificacoesPreguicosas";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { urlDoSite } from "@/lib/site";
import { COR_PAPEL } from "@/lib/tokens";
import { cormorant, cormorantItalico, jost } from "./fontes";
import "./globals.css";

const { titulo } = casamento.noivos;

export const metadata: Metadata = {
  metadataBase: urlDoSite(),
  title: {
    default: titulo,
    template: `%s · ${titulo}`,
  },
  description: textos.metadados.descricao(titulo),
  // A imagem vem de app/opengraph-image.jpg (gerada por scripts/gerar-imagens.tsx).
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: titulo,
    title: titulo,
    description: textos.metadados.descricao(titulo),
  },
};

export const viewport: Viewport = {
  themeColor: COR_PAPEL,
  colorScheme: "light",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o script da abertura marca o <html> antes da hidratação (DECISOES L1).
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${cormorantItalico.variable} ${jost.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ABERTURA }} />
      </head>
      <body className="min-h-dvh">
        <MonogramaSprite />
        <a href="#conteudo" className="pular-conteudo">
          {textos.navegacao.pularParaConteudo}
        </a>
        {children}
        <NotificacoesPreguicosas />
      </body>
    </html>
  );
}
