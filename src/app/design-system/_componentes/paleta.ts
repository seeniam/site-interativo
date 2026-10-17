/** Documentação da paleta (briefing 3.2). Um teste garante que estes valores batem com globals.css. */
export interface Cor {
  token: string;
  hex: string;
  papel: string;
  /** Precisa de contorno para aparecer sobre o papel. */
  clara?: boolean;
}

export const GRUPOS_DE_COR: readonly { nome: string; cores: readonly Cor[] }[] = [
  {
    nome: "Papel",
    cores: [
      { token: "branco", hex: "#FFFFFF", papel: "Superfícies e cards", clara: true },
      { token: "papel", hex: "#FCFAF7", papel: "Fundo da página", clara: true },
      { token: "linho", hex: "#F4EFE7", papel: "Seções alternadas, hover suave", clara: true },
      { token: "champanhe", hex: "#F7EEDC", papel: "Realce, seleção, selos", clara: true },
    ],
  },
  {
    nome: "Ouro",
    cores: [
      { token: "ouro-claro", hex: "#E8D08A", papel: "Ponto alto do brilho" },
      { token: "ouro", hex: "#C9A227", papel: "Filetes e ícones — nunca texto" },
      { token: "ouro-escuro", hex: "#8C6B2F", papel: "Texto dourado (AA), pressionado" },
    ],
  },
  {
    nome: "Tinta",
    cores: [
      { token: "tinta", hex: "#17140F", papel: "Texto principal" },
      { token: "fumaca", hex: "#6E675C", papel: "Texto secundário" },
      { token: "borda", hex: "rgba(23,20,15,.10)", papel: "Bordas e divisões", clara: true },
    ],
  },
  {
    nome: "Respostas",
    cores: [
      { token: "sucesso", hex: "#4F7A4A", papel: "Confirmado" },
      { token: "recusa", hex: "#9A5B4C", papel: "Não poderá ir — terroso, nunca erro" },
    ],
  },
];
