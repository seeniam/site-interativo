/**
 * Exportar CSV da lista dos noivos (briefing 6.6): gerado no cliente, `;` como separador e
 * UTF-8 com BOM, para o Excel em português abrir com acentos e colunas certas.
 */
import type { RespostaConvidado } from "@/lib/convidados";
import { formatarDataHoraPlanilha, formatarTelefone } from "@/lib/format";

const BOM = "\uFEFF";
const SEPARADOR = ";";

/**
 * Uma célula. Nome e recado vêm de convidados: começando com `=`, `+`, `-` ou `@` o Excel
 * executaria como fórmula (injeção de CSV) — por isso ganham um apóstrofo na frente.
 */
export function celulaCsv(valor: string | number): string {
  let texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\r\n]|^\s|\s$/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

const STATUS = { confirmado: "Confirmado", recusou: "Não vai" } as const;

export const COLUNAS_CSV = [
  "Nome",
  "Status",
  "Acompanhantes",
  "Nomes dos acompanhantes",
  "Quem convidou",
  "Telefone",
  "Recado",
  "Respondeu em",
] as const;

function telefoneLegivel(telefone: string): string {
  try {
    return formatarTelefone(telefone);
  } catch {
    return telefone;
  }
}

export function gerarCsvConvidados(respostas: readonly RespostaConvidado[]): string {
  const linhas = respostas.map((r) => [
    r.nome,
    STATUS[r.status],
    r.acompanhantes.length,
    r.acompanhantes.join(", "),
    r.convidadoPor,
    telefoneLegivel(r.telefone),
    r.recado,
    formatarDataHoraPlanilha(r.respondidoEm),
  ]);
  return BOM + [COLUNAS_CSV, ...linhas].map((linha) => linha.map(celulaCsv).join(SEPARADOR)).join("\r\n") + "\r\n";
}

/** "convidados-2026-10-18.csv", com a data de Brasília. */
export function nomeArquivoCsv(agora: Date): string {
  const [dia, mes, ano] = formatarDataHoraPlanilha(agora).split(" ")[0]?.split("/") ?? [];
  return `convidados-${ano}-${mes}-${dia}.csv`;
}
