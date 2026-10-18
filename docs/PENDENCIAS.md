# Pendências do cliente

Vocabulário obrigatório (briefing 4), igual no código, nos selos e aqui — nunca um pelo outro:

- **a confirmar** — o dado chegou, mas há dúvida. Aparece no site com o selo "a confirmar".
  No código: `casamento.aConfirmar`.
- **a definir** — o dado não existe. O lugar dele mostra o que falta, com o selo "a definir"
  (ou, no caso de "nossa história", a seção inteira não é renderizada).
  No código: `pendente("...")`.

As duas listas, sempre atualizadas a partir do config, estão em `/design-system#pendencias`.

## Confirmado pelo casal em 17/10/2026

Nada aqui bloqueia mais. Data 21/12/2026 (**segunda-feira, intencional** — o FAQ avisa que é dia útil),
a partir das 16h30; cerimônia e recepção no Espaço Max; Colossenses 3:14; cotas Bronze R$ 150,
Prata R$ 200, Ouro R$ 250; recebedora do PIX "JAQUELINE BARROS ALVARES" (24 caracteres);
WhatsApp de comprovante = número da chave PIX; **uma única foto, sem previsão de outras** (usada
só no herói).

## Definido pelo casal em 18/10/2026

- **Trajes:** traje social. "A escolha das cores fica a critério de cada convidado. Pedimos
  apenas que o branco seja reservado à noiva." Sem amostras de cor (DECISOES A2).
- **Convite individual:** não existem acompanhantes (DECISOES A1).
- **Prazo para confirmar presença:** retirado do site em 18/10/2026 — não há mais "Responda até", nem
  placeholder, nem pergunta no FAQ (DECISOES B1). Se o casal quiser um prazo no futuro, é só voltar a incluir.

## A confirmar

Nenhum item.

## A definir — nenhum trava o desenvolvimento

| # | Item | Onde entra | Enquanto não chega |
|---|------|------------|--------------------|
| D1 | 3 a 5 marcos de "nossa história" — **só texto** (ano, título, uma frase) | Seção "Nossa história" | A seção inteira **não é renderizada**. Nada de marco inventado. |

## Histórico (resolvido)

- C1–C6 (ano, de-para das cotas, recebedor do PIX, WhatsApp, local da cerimônia, versículo) —
  confirmados pelo casal em 17/10/2026. O antigo C7 (limite de acompanhantes) deixou de existir:
  o convite é individual (18/10/2026).
- D2 — traje: definido pelo casal em 18/10/2026 (acima).
- Galeria, fotos adicionais e recorte de detalhe — **não existirão** (briefing 3.7, "A foto única").
- Frases das cotas — o briefing traz descrição vazia: as cotas não têm frase.
- Privacidade dos telefones — resolvida pela troca de arquitetura: o navegador nunca fala com
  o banco; só os Route Handlers, e a lista exige a sessão dos noivos.

## Pendências técnicas (do time, não do cliente)

| # | Item | Quando |
|---|------|--------|
| T1 | Criar o Postgres pelo Marketplace da Vercel e rodar `db/schema.sql` uma vez. | Antes de publicar |
| T2 | Definir `SENHA_NOIVOS`, `SESSAO_SECRET` e `RSVP_SALT` na Vercel (modelo em `.env.example`). | Antes de publicar |
| T3 | Medir o Lighthouse mobile no **PageSpeed Insights** com o site publicado (meta ≥ 95 em Performance, Acessibilidade e Boas Práticas). Localmente a nota oscila com a CPU da máquina (DECISOES H13, fechamento da Fase 3). | Logo após o primeiro deploy |
| T4 | Os limites por IP (RSVP 3/min, login 5/min) vivem na memória de cada instância (DECISOES R2), como o briefing permite. Se aparecer abuso real, ativar uma regra de limite no Firewall da Vercel. | Só se necessário |
