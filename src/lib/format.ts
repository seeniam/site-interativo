/**
 * Formatadores pt-BR: moeda, telefone, datas (sempre no fuso de Brasília) e nomes.
 * Funções puras; entradas inválidas lançam RangeError em vez de exibir lixo.
 */

export const FUSO_BRASILIA = "America/Sao_Paulo";

// ── Moeda ────────────────────────────────────────────────────────────────────

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

// ── Telefone ─────────────────────────────────────────────────────────────────

export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

/**
 * Os dígitos de um telefone brasileiro como as pessoas digitam ou colam:
 * tira o 0 de tronco ("(098) …") e o código do país ("+55 …"). Resultado: DDD + número.
 */
export function normalizarTelefone(texto: string): string {
  let d = somenteDigitos(texto).replace(/^0+/, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d;
}

/** Celular (11 dígitos, 9 depois do DDD) ou fixo (10 dígitos, começando de 2 a 5). DDD de 11 a 99. */
export function telefoneValido(texto: string): boolean {
  const d = normalizarTelefone(texto);
  if (!/^[1-9][1-9]/.test(d)) return false;
  if (d.length === 11) return d[2] === "9";
  return d.length === 10 && /[2-5]/.test(d[2] ?? "");
}

/** "(98) 99967-6346" ou "(98) 3232-1234". */
export function formatarTelefone(texto: string): string {
  const d = normalizarTelefone(texto);
  if (!telefoneValido(d)) throw new RangeError(`Telefone inválido: ${texto}`);
  const meio = d.length === 11 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`;
}

/**
 * Máscara progressiva enquanto a pessoa digita: "9" → "(9", "98999" → "(98) 999".
 * Se o número depois do DDD começa com 9, já formata como celular — o hífen não "pula"
 * de lugar no último dígito. Aceita colar com +55 ou 0 na frente. Nunca passa de 11 dígitos.
 */
export function mascararDigitacaoTelefone(texto: string): string {
  const d = normalizarTelefone(texto).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const meio = d[2] === "9" ? 7 : 6;
  if (d.length <= meio) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`;
}

/** Privacidade em /convidados: "(98) 9****-**46". Mantém DDD, primeiro e dois últimos dígitos. */
export function ocultarTelefone(texto: string): string {
  const d = normalizarTelefone(texto);
  if (!telefoneValido(d)) throw new RangeError(`Telefone inválido: ${texto}`);
  const meio = d.length === 11 ? 7 : 6;
  const asteriscosAntes = "*".repeat(meio - 3);
  const asteriscosDepois = "*".repeat(d.length - meio - 2);
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)}${asteriscosAntes}-${asteriscosDepois}${d.slice(-2)}`;
}

/**
 * Telefone para a lista dos noivos: inteiro ("(98) 99967-6346") ou com a máscara de discrição.
 * Número fora do padrão nunca quebra a tela: aparece cru quando visível, e escondido quando não.
 */
export function exibirTelefone(texto: string, visivel: boolean): string {
  try {
    return visivel ? formatarTelefone(texto) : ocultarTelefone(texto);
  } catch {
    return visivel ? texto : "••••";
  }
}

// ── Datas (fuso de Brasília, independente do relógio de quem abre) ───────────

/**
 * Tudo sai direto do `Intl` com `timeZone` de Brasília — nunca de um `Date` reinterpretado no
 * fuso da máquina, que erraria a hora para quem abre de um lugar com horário de verão.
 * (Não usa `TZDate`: o construtor dele chama `new Date()` sem argumento, e o Next 16 com
 * cacheComponents recusa isso na pré-renderização — DECISOES F7.)
 */
const RELOGIO = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_BRASILIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const MES_POR_EXTENSO = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO_BRASILIA, month: "long" });
const DIA_DA_SEMANA = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO_BRASILIA, weekday: "long" });

interface RelogioDeParede {
  ano: string;
  mes: string;
  dia: string;
  hora: number;
  minuto: number;
  instante: Date;
}

function emBrasilia(data: Date | string): RelogioDeParede {
  const instante = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(instante.getTime())) throw new RangeError(`Data inválida: ${String(data)}`);
  const partes = Object.fromEntries(RELOGIO.formatToParts(instante).map((p) => [p.type, p.value]));
  return {
    ano: partes.year ?? "",
    mes: partes.month ?? "",
    dia: partes.day ?? "",
    // Alguns motores devolvem "24" à meia-noite com hour12: false.
    hora: Number(partes.hour) % 24,
    minuto: Number(partes.minute),
    instante,
  };
}

function horaDoRelogio({ hora, minuto }: RelogioDeParede): string {
  return minuto === 0 ? `${hora}h` : `${hora}h${String(minuto).padStart(2, "0")}`;
}

/** "16h30"; hora cheia vira "16h". */
export function formatarHora(data: Date | string): string {
  return horaDoRelogio(emBrasilia(data));
}

export interface DataPorExtenso {
  /** "21 de dezembro de 2026" */
  data: string;
  /** "segunda-feira" */
  diaDaSemana: string;
  /** "16h30" */
  hora: string;
}

export function partesDataPorExtenso(data: Date | string): DataPorExtenso {
  const relogio = emBrasilia(data);
  return {
    data: `${Number(relogio.dia)} de ${MES_POR_EXTENSO.format(relogio.instante)} de ${relogio.ano}`,
    diaDaSemana: DIA_DA_SEMANA.format(relogio.instante),
    hora: horaDoRelogio(relogio),
  };
}

/** "21 de dezembro de 2026 · segunda-feira · 16h30" (formato do herói, briefing 6.1). */
export function formatarDataPorExtenso(data: Date | string): string {
  const { data: dia, diaDaSemana, hora } = partesDataPorExtenso(data);
  return `${dia} · ${diaDaSemana} · ${hora}`;
}

/** "21.12.2026" (para "Casados desde 21.12.2026"). */
export function formatarDataPontuada(data: Date | string): string {
  const { dia, mes, ano } = emBrasilia(data);
  return `${dia}.${mes}.${ano}`;
}

/** "18/10/2026 15:05" — para planilha (o Excel reconhece como data e hora). */
export function formatarDataHoraPlanilha(data: Date | string): string {
  const { dia, mes, ano, hora, minuto } = emBrasilia(data);
  return `${dia}/${mes}/${ano} ${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

/** "12/03" — data curta. */
export function formatarDiaMes(data: Date | string): string {
  const { dia, mes } = emBrasilia(data);
  return `${dia}/${mes}`;
}

// ── Nomes ────────────────────────────────────────────────────────────────────

/** Apóstrofo tipográfico (teclado do iPhone) vira o reto, e acentos ficam na forma composta. */
export function normalizarNome(texto: string): string {
  return texto.normalize("NFC").replace(/[‘’ʼ`´]/g, "'");
}

const TRATAMENTOS = new Set(["dr", "dra", "sr", "sra", "srta", "pe", "prof", "profa", "pr"]);

/** "ana-clara" → "Ana-Clara"; "d'ávila" → "D'Ávila". */
function capitalizarSegmentos(nome: string): string {
  return nome
    .split(/([-'])/)
    .map((parte) => parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1).toLocaleLowerCase("pt-BR"))
    .join("");
}

/**
 * Primeiro nome para "Obrigado, Ana!" e para a URL de /agradecimento.
 * Pula tratamentos ("Dr. João" → "João"), mantém só letras, hífen e apóstrofo, no máximo 30
 * caracteres. Quem escreveu tudo minúsculo ou tudo maiúsculo ganha capitalização; quem
 * misturou ("McKenzie", "d'Ávila") fica como escreveu, só com a primeira letra maiúscula.
 */
export function primeiroNome(nomeCompleto: string): string {
  const tokens = normalizarNome(nomeCompleto).trim().split(/\s+/u);
  const escolhido = tokens.find((t) => {
    const letras = t.replace(/[^\p{L}]/gu, "");
    return letras.length >= 2 && !t.endsWith(".") && !TRATAMENTOS.has(letras.toLocaleLowerCase("pt-BR"));
  });
  const limpo = (escolhido ?? "").replace(/[^\p{L}'-]/gu, "").slice(0, 30);
  if (!limpo) return "";
  const misturado = limpo !== limpo.toLocaleLowerCase("pt-BR") && limpo !== limpo.toLocaleUpperCase("pt-BR");
  return misturado ? limpo.charAt(0).toLocaleUpperCase("pt-BR") + limpo.slice(1) : capitalizarSegmentos(limpo);
}
