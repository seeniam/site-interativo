-- O convite é individual: não existem acompanhantes neste casamento (DECISOES A1).
-- Para bancos criados com a versão antiga do db/schema.sql, que tinha a coluna.
--
-- Ordem: publique primeiro a versão do site sem acompanhantes e só depois rode isto.
-- (O site novo não lê nem grava a coluna; o antigo gravava, e quebraria sem ela.)
--
-- Antes, para saber se alguém chegou a preencher acompanhantes (a informação some com a coluna):
--   select nome, acompanhantes from confirmacoes where acompanhantes <> '[]'::jsonb;

alter table confirmacoes drop column if exists acompanhantes;
