"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Monograma } from "@/components/brand/Monograma";
import { FileteDourado } from "@/components/brand/FileteDourado";
import { Botao } from "@/components/ui/Botao";
import { textos } from "@/config/textos";
import { useHidratado } from "@/lib/hooks/useHidratado";

const { convidados } = textos;

interface LoginNoivosProps {
  /** Só em modo demonstração (briefing 5). Em produção chega sempre `null`. */
  senhaDeDemonstracao: string | null;
}

/** A porta da lista: sóbria, com o monograma. A proteção real é o 401 de `/api/convidados`. */
export function LoginNoivos({ senhaDeDemonstracao }: LoginNoivosProps) {
  const router = useRouter();
  const hidratado = useHidratado();
  const id = useId();
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (entrando || !senha) return;
    setEntrando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/entrar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (resposta.ok) {
        // O cookie httpOnly já veio; o servidor redesenha a página com a lista.
        router.refresh();
        return;
      }
      setErro(
        resposta.status === 401
          ? convidados.login.senhaIncorreta
          : resposta.status === 429
            ? convidados.login.muitasTentativas
            : convidados.login.falha,
      );
    } catch {
      setErro(convidados.login.falha);
    }
    setEntrando(false);
  }

  return (
    <div className="conteiner pt-10 sm:pt-16">
      <form
        method="post"
        noValidate
        onSubmit={entrar}
        aria-labelledby={`${id}-titulo`}
        className="cartao-rsvp items-center text-center"
      >
        <Monograma decorativo className="h-14 w-auto" />
        <div className="flex flex-col items-center gap-4">
          <h1 id={`${id}-titulo`} className="font-display text-39 font-light text-tinta sm:text-49">
            {convidados.titulo}
          </h1>
          <FileteDourado />
          <p className="text-16 text-balance text-fumaca">{convidados.login.texto}</p>
        </div>

        <div className="campo w-full text-left">
          <label htmlFor={`${id}-senha`} className="campo__rotulo">
            {convidados.login.senha}
          </label>
          <input
            id={`${id}-senha`}
            type="password"
            name="senha"
            autoComplete="current-password"
            enterKeyHint="go"
            required
            className="campo__entrada"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={erro === convidados.login.senhaIncorreta ? true : undefined}
            aria-describedby={erro ? `${id}-erro` : undefined}
          />
          {erro && (
            <p id={`${id}-erro`} role="alert" className="campo__erro">
              {erro}
            </p>
          )}
        </div>

        <Botao
          type="submit"
          tamanho="grande"
          bloco
          disabled={!hidratado}
          carregando={entrando}
          textoCarregando={convidados.login.entrando}
        >
          {convidados.login.entrar}
        </Botao>

        {senhaDeDemonstracao && (
          <p className="aviso-rsvp w-full text-left text-14" data-aviso-demonstracao="">
            <span>
              {convidados.login.demonstracao} <strong className="font-normal">“{senhaDeDemonstracao}”</strong>.
            </span>
          </p>
        )}

        <Link href="/" className="botao botao--texto">
          {convidados.voltarAoConvite}
        </Link>
      </form>
    </div>
  );
}
