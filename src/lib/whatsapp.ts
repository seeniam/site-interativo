/**
 * Links do WhatsApp (`wa.me`) com mensagem pronta. Funções puras.
 * O corpo da mensagem é texto do casal que sai no app do convidado — o único lugar onde
 * emoji é permitido (briefing 9).
 */

/** Só dígitos, com DDI (55…). */
function numeroWaMe(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  if (!/^55\d{10,11}$/.test(digitos)) throw new RangeError(`Número de WhatsApp inválido: ${numero}`);
  return digitos;
}

export function linkWhatsApp(numero: string, mensagem: string): string {
  return `https://wa.me/${numeroWaMe(numero)}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * "Enviar comprovante" (briefing 6.3): a mensagem do casal, o presente com o valor e um
 * espaço para o convidado escrever o nome.
 */
export function linkComprovante(numero: string, mensagemDoCasal: string, linhasDoPresente: readonly string[]): string {
  return linkWhatsApp(numero, [mensagemDoCasal, "", ...linhasDoPresente].join("\n"));
}
