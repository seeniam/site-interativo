/**
 * A voz da interface: rótulos, botões, estados. Simples, calorosa, direta (briefing 9).
 * O botão diz o que acontece. Conteúdo do casal (datas, locais, frases) fica em `casamento.ts`.
 */
export const textos = {
  navegacao: {
    rotulo: "Navegação do convite",
    pularParaConteudo: "Pular para o conteúdo",
    inicio: "Voltar ao início do convite",
    itens: [
      { href: "/", rotulo: "Convite", icone: "alianca" },
      { href: "/presentear", rotulo: "Presentear", icone: "presente" },
      { href: "/confirmar-presenca", rotulo: "Confirmar", icone: "taca" },
    ],
    confirmarPresenca: "Confirmar presença",
  },
  convite: {
    heroi: {
      rolar: "Role para ver o convite",
      presentear: "Presentear",
    },
    contagem: {
      titulo: "Contando os dias",
      unidades: { dias: "dias", horas: "horas", minutos: "minutos", segundos: "segundos" },
      leitorDeTela: (dias: number) => `Faltam ${dias} dia${dias === 1 ? "" : "s"} para o casamento.`,
      hoje: "Hoje é o dia",
      hojeDetalhe: (hora: string) => `A gente se encontra às ${hora}.`,
      casadosDesde: (data: string) => `Casados desde ${data}`,
    },
    historia: {
      titulo: "Nossa história",
    },
    local: {
      titulo: "Quando e onde",
      cerimoniaERecepcao: "Cerimônia e recepção",
      rotuloQuando: "Quando",
      rotuloEndereco: "Endereço",
      cerimonia: "Cerimônia",
      recepcao: "Recepção",
      verNoMapa: "Ver no mapa",
      copiarEndereco: "Copiar endereço",
      enderecoCopiado: "Endereço copiado",
      copiaFalhou: "Não deu para copiar. Toque e segure o endereço para copiar.",
      adicionarAgenda: "Adicionar à agenda",
      baixarIcs: "Baixar para o celular (.ics)",
      googleAgenda: "Google Agenda",
      mostrarMapa: "Mostrar mapa aqui",
      tituloMapa: (local: string) => `Mapa: ${local}`,
      abreEmNovaAba: "(abre em nova aba)",
    },
    trajes: {
      titulo: "Trajes",
      paleta: "Cores que combinam com o dia",
    },
    presentes: {
      titulo: "Presentes",
      texto: "Sua presença já é o presente. Se quiser nos ajudar a começar a vida a dois, escolha uma cota.",
      verLista: "Ver lista completa",
    },
    duvidas: {
      titulo: "Dúvidas frequentes",
    },
    rsvp: {
      titulo: "Vem com a gente?",
      confirmeAte: "Confirme até",
      botao: "Confirmar presença",
    },
  },
  rodape: {
    assinatura: (casal: string) => `com amor, ${casal}`,
    convidados: "Lista de convidados",
    creditoFoto: "Foto: arquivo do casal",
  },
  naoEncontrada: {
    titulo: "Esta página não existe no nosso convite",
    texto: "O endereço pode ter mudado, ou um caractere ficou de fora no link.",
    voltar: "Voltar ao convite",
  },
  rsvp: {
    erros: {
      nomeObrigatorio: "Escreva seu nome completo, por favor.",
      nomeCurto: "Seu nome precisa ter pelo menos 3 letras.",
      nomeCaracteres: "Use só letras no nome (acentos, hífen e apóstrofo valem).",
      nomeLongo: "Esse nome ficou longo demais. Pode abreviar?",
      telefoneObrigatorio: "Faltou o telefone pra gente te avisar de mudanças.",
      telefoneInvalido: "Confira o telefone: DDD + número, como (98) 99967-6346.",
      statusObrigatorio: "Conta pra gente: você vem?",
      acompanhanteNome: "Escreva o nome de quem vem com você.",
      acompanhantesDemais: (max: number) => `Dá para trazer até ${max} acompanhante${max === 1 ? "" : "s"}.`,
      convidadoPorObrigatorio: "Conta pra gente quem te convidou.",
      convidadoPorLongo: "Esse nome ficou longo demais.",
      recadoLongo: (max: number) => `O recado pode ter até ${max} caracteres.`,
    },
  },
  agenda: {
    titulo: (casal: string) => `Casamento de ${casal}`,
    descricao: (casal: string) => `Te esperamos para celebrar com a gente. ${casal}`,
  },
  metadados: {
    descricao: (casal: string) => `Convite de casamento de ${casal}.`,
  },
  /** Vocabulário obrigatório (briefing 4). Nunca usar um pelo outro. */
  pendente: {
    leitorDeTela: "Ainda não definido:",
    /** O dado ainda não existe. */
    selo: "a definir",
  },
  aConfirmar: {
    /** O dado chegou, mas há dúvida sobre ele. */
    selo: "a confirmar",
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
