import type { Metadata, Viewport } from "next";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { COR_PAPEL } from "@/lib/tokens";
import { cormorant, jost, pinyon } from "./fontes";
import "./globals.css";

const { titulo } = casamento.noivos;

export const metadata: Metadata = {
  title: {
    default: titulo,
    template: `%s · ${titulo}`,
  },
  description: textos.metadados.descricao(titulo),
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
    <html lang="pt-BR" className={`${cormorant.variable} ${jost.variable} ${pinyon.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
