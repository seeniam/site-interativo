/**
 * Formatadores pt-BR. Fase 0 traz só o que os cards do design system precisam;
 * a Fase 1 completa (telefone, data por extenso) com date-fns.
 */

const FUSO = "America/Sao_Paulo";

const brlInteiro = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const brlCentavos = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "R$ 150" para valores inteiros, "R$ 149,90" quando há centavos. */
export function formatarBRL(valor: number): string {
  if (!Number.isFinite(valor)) {
    throw new RangeError(`Valor inválido para moeda: ${valor}`);
  }
  return Number.isInteger(valor) ? brlInteiro.format(valor) : brlCentavos.format(valor);
}

/** Separa símbolo e número para compor "R$" pequeno ao lado do valor grande. */
export function partesBRL(valor: number): { simbolo: string; numero: string } {
  const texto = formatarBRL(valor);
  const [simbolo = "R$", ...resto] = texto.split(/\s/u);
  return { simbolo, numero: resto.join("") };
}

const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: FUSO });

/** "12/03" — data curta, no fuso de Brasília. */
export function formatarDiaMes(data: Date): string {
  if (Number.isNaN(data.getTime())) {
    throw new RangeError("Data inválida");
  }
  return diaMes.format(data);
}
