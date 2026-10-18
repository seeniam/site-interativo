/**
 * A lista de presentes, à parte do resto do config para poder ser lida pelo `proxy`
 * (que barra ids inexistentes com 404 de verdade) sem arrastar a importação da foto.
 * O `casamento.ts` reexporta esta lista — continua sendo a fonte única de verdade.
 */
import type { Presente } from "@/types/casamento";

// Confirmado pelo casal: Bronze 150, Prata 200, Ouro 250.
export const PRESENTES = [
  {
    id: "bronze",
    tipo: "cota",
    titulo: "Cota Bronze",
    valor: 150,
    descricao: "",
    icone: "taca",
  },
  {
    id: "prata",
    tipo: "cota",
    titulo: "Cota Prata",
    valor: 200,
    descricao: "",
    icone: "alianca",
  },
  {
    id: "ouro",
    tipo: "cota",
    titulo: "Cota Ouro",
    valor: 250,
    descricao: "",
    icone: "presente",
    destaque: true,
  },
] as const satisfies readonly Presente[];

export const IDS_DE_PRESENTES: readonly string[] = PRESENTES.map((p) => p.id);
