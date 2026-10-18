-- Schema do convite de Jaqueline & Diorlando (briefing, seção 5).
-- Rodar uma vez no Postgres da Vercel (Neon): Storage → o banco → Query, colar e executar.
-- O navegador nunca fala com o banco: só os Route Handlers do Next.

create table confirmacoes (
  id             bigserial primary key,
  nome           text        not null,
  telefone       text        not null,
  telefone_hash  text        not null,          -- sha256(telefone + RSVP_SALT do servidor)
  vai_comparecer boolean     not null,
  acompanhantes  jsonb       not null default '[]'::jsonb,
  quem_convidou  text,
  recado         text,
  atualiza_de    text,                          -- hash da resposta que esta substitui
  criado_em      timestamptz not null default now()
);
create index confirmacoes_telefone_hash_idx on confirmacoes (telefone_hash);

create table presentes_reservados (
  cota_id      text primary key,
  reservado_em timestamptz not null default now()
);
