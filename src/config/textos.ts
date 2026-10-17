/**
 * A voz da interface: rótulos, botões, estados. Simples, calorosa, direta (briefing 9).
 * O botão diz o que acontece. Conteúdo do casal (datas, locais, frases) fica em `casamento.ts`.
 */
export const textos = {
  metadados: {
    descricao: (casal: string) => `Convite de casamento de ${casal}.`,
  },
  pendente: {
    leitorDeTela: "Ainda não definido:",
    // "a definir" = o casal ainda não enviou. Diferente de "a confirmar" em PENDENCIAS.md.
    selo: "a definir",
  },
  presentes: {
    botao: "Presentear",
    rotuloAcessivel: (titulo: string, valor: string) => `Presentear: ${titulo}, ${valor}`,
    presenteado: {
      selo: "Presenteado com carinho",
      convite: "Este já chegou até nós. Que tal escolher outro da lista?",
      botao: "Já presenteado",
    },
  },
  convidados: {
    status: {
      confirmado: "Confirmado",
      recusou: "Não vai",
    },
    rotulos: {
      acompanhantes: "Acompanhantes",
      convidadoPor: "Convidado por",
      respondeuEm: "Respondeu em",
    },
    prefixoConvidadoPor: "por",
  },
} as const;
