"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { IconeCarta, IconeTaca } from "@/components/brand/icons";
import { Botao } from "@/components/ui/Botao";
import { textos } from "@/config/textos";
import {
  formatarDiaMes,
  mascararDigitacaoTelefone,
  normalizarTelefone,
  primeiroNome,
  telefoneValido,
} from "@/lib/format";
import { armazenamentoDaAba, atingiuLimiteDeEnvios, contarEnvio } from "@/lib/envios-da-sessao";
import { useHidratado } from "@/lib/hooks/useHidratado";
import { LIMITE_RECADO, criarEsquemaRsvp, passoDoCampo, type DadosRsvp, type EntradaRsvp } from "@/lib/schemas/rsvp";

const { rsvp } = textos;

type Passo = 1 | 2 | 3;
type Envio = "parado" | "enviando" | "falhou" | "muitas-tentativas" | "limite-da-sessao";

interface FormularioRsvpProps {
  maxAcompanhantes: number;
  /** Nomes dos noivos para "Quem convidou você?". */
  noivos: readonly [string, string];
  /** wa.me dos noivos, para quem bateu no limite de envios da sessão. */
  linkWhatsApp: string;
}

function Erro({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="campo__erro">
      {children}
    </p>
  );
}

export function FormularioRsvp({ maxAcompanhantes, noivos, linkWhatsApp }: FormularioRsvpProps) {
  const router = useRouter();
  const hidratado = useHidratado();
  const id = useId();
  const esquema = useMemo(() => criarEsquemaRsvp(maxAcompanhantes), [maxAcompanhantes]);
  const {
    register,
    control,
    handleSubmit,
    trigger,

    setValue,
    setError,
    formState: { errors },
  } = useForm<EntradaRsvp, unknown, DadosRsvp>({
    resolver: zodResolver(esquema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { nome: "", telefone: "", acompanhantes: [], convidadoPor: "", recado: "", site: "" },
  });
  const acompanhantes = useFieldArray({ control, name: "acompanhantes" });

  const [passo, setPasso] = useState<Passo>(1);
  const [envio, setEnvio] = useState<Envio>("parado");
  const [jaConfirmouEm, setJaConfirmouEm] = useState<string | null>(null);
  const telefoneVerificado = useRef("");
  const titulo = useRef<HTMLHeadingElement>(null);
  const mudouDePasso = useRef(false);

  const status = useWatch({ control, name: "status" });
  const recado = useWatch({ control, name: "recado" }) ?? "";
  const convidadoPor = useWatch({ control, name: "convidadoPor" });
  const vem = status === "confirmado";

  // Ao trocar de passo, o foco vai para o título do passo novo (leitor de tela anuncia onde está).
  useEffect(() => {
    if (!mudouDePasso.current) return;
    titulo.current?.focus();
  }, [passo]);

  // No último passo, a casca de /agradecimento já vem carregada: depois do envio a troca é imediata.
  useEffect(() => {
    if (passo === 3) router.prefetch("/agradecimento");
  }, [passo, router]);

  function irPara(novo: Passo) {
    mudouDePasso.current = true;
    setPasso(novo);
  }

  function camposDoPasso(alvo: Passo): FieldPath<EntradaRsvp>[] {
    if (alvo === 1) return ["nome", "telefone"];
    if (alvo === 2) return ["status"];
    if (!vem) return ["recado"];
    return [
      "acompanhantes",
      ...acompanhantes.fields.map((_, i) => `acompanhantes.${i}.nome` as const),
      "convidadoPor",
      "recado",
    ];
  }

  async function avancar() {
    if (envio === "enviando") return;
    const valido = await trigger(camposDoPasso(passo), { shouldFocus: true });
    if (!valido) return;
    if (passo < 3) irPara((passo + 1) as Passo);
    else await handleSubmit(enviar)();
  }

  async function verificarTelefone(valor: string) {
    if (!telefoneValido(valor)) return;
    const telefone = normalizarTelefone(valor);
    if (telefone === telefoneVerificado.current) return;
    telefoneVerificado.current = telefone;
    setJaConfirmouEm(null);
    try {
      const resposta = await fetch("/api/rsvp/verificar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ telefone }),
      });
      if (!resposta.ok) return;
      const corpo = (await resposta.json()) as { jaConfirmou?: boolean; em?: string };
      if (telefoneVerificado.current === telefone && corpo.jaConfirmou && corpo.em) {
        setJaConfirmouEm(formatarDiaMes(corpo.em));
      }
    } catch {
      // Sem o aviso, o envio continua funcionando: a resposta nova vale do mesmo jeito.
    }
  }

  async function enviar(dados: DadosRsvp) {
    if (atingiuLimiteDeEnvios(armazenamentoDaAba())) {
      setEnvio("limite-da-sessao");
      return;
    }
    setEnvio("enviando");
    let resposta: Response;
    try {
      resposta = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(dados),
      });
    } catch {
      setEnvio("falhou");
      return;
    }

    if (resposta.ok) {
      contarEnvio(armazenamentoDaAba());
      // Na URL, só o primeiro nome — nada sensível (briefing 6.4).
      const parametros = new URLSearchParams({ nome: primeiroNome(dados.nome) });
      if (dados.status === "recusou") parametros.set("resposta", "nao");
      router.push(`/agradecimento?${parametros}`);
      return; // continua "enviando" até a navegação: nada de clique duplo.
    }
    if (resposta.status === 429) {
      setEnvio("muitas-tentativas");
      return;
    }
    if (resposta.status === 400) {
      const corpo = (await resposta.json().catch(() => null)) as { campos?: Record<string, string> } | null;
      const campos = Object.entries(corpo?.campos ?? {});
      for (const [campo, mensagem] of campos) setError(campo as FieldPath<EntradaRsvp>, { message: mensagem });
      const primeiro = campos[0]?.[0];
      if (primeiro) irPara(passoDoCampo(primeiro));
      setEnvio(campos.length ? "parado" : "falhou");
      return;
    }
    setEnvio("falhou");
  }

  const nomeCampo = register("nome");
  const telefoneCampo = register("telefone");
  const nomeTitulo = { 1: rsvp.passos.quem, 2: rsvp.passos.vem, 3: vem ? rsvp.passos.detalhes : rsvp.passos.recado }[
    passo
  ];
  const ids = {
    titulo: `${id}-titulo`,
    nomeErro: `${id}-nome-erro`,
    telefoneAjuda: `${id}-telefone-ajuda`,
    telefoneErro: `${id}-telefone-erro`,
    statusErro: `${id}-status-erro`,
    acompanhantesAjuda: `${id}-acomp-ajuda`,
    convidadoPorAjuda: `${id}-convidou-ajuda`,
    convidadoPorErro: `${id}-convidou-erro`,
    sugestoes: `${id}-sugestoes`,
    recadoContador: `${id}-recado-contador`,
    recadoErro: `${id}-recado-erro`,
  };
  const descrito = (...lista: (string | false | undefined)[]) => lista.filter(Boolean).join(" ") || undefined;

  return (
    <form
      noValidate
      method="post"
      aria-labelledby={ids.titulo}
      className="cartao-rsvp"
      onSubmit={(evento) => {
        evento.preventDefault();
        void avancar();
      }}
    >
      <div className="progresso-rsvp">
        <p className="text-12 tracking-wide text-fumaca">{rsvp.passoDeTotal(passo, 3)}</p>
        <div className="progresso-rsvp__trilho" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span key={n} className="progresso-rsvp__segmento" data-cheio={n <= passo ? "" : undefined} />
          ))}
        </div>
      </div>

      <h2
        ref={titulo}
        id={ids.titulo}
        tabIndex={-1}
        className="font-display text-31 font-light text-tinta outline-none sm:text-39"
      >
        {nomeTitulo}
      </h2>

      {/* Honeypot: fora da tela e fora do Tab; pessoas não veem, robôs preenchem. */}
      <div aria-hidden className="campo-isca">
        <label>
          {rsvp.campos.isca}
          <input type="text" tabIndex={-1} autoComplete="off" {...register("site")} />
        </label>
      </div>

      {passo === 1 && (
        <div className="flex flex-col gap-6">
          <div className="campo">
            <label htmlFor={`${id}-nome`} className="campo__rotulo">
              {rsvp.campos.nome}
            </label>
            <input
              id={`${id}-nome`}
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              className="campo__entrada"
              aria-invalid={errors.nome ? true : undefined}
              aria-describedby={descrito(errors.nome && ids.nomeErro)}
              {...nomeCampo}
            />
            <Erro id={ids.nomeErro}>{errors.nome?.message}</Erro>
          </div>

          <div className="campo">
            <label htmlFor={`${id}-telefone`} className="campo__rotulo">
              {rsvp.campos.telefone}
            </label>
            <input
              id={`${id}-telefone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              enterKeyHint="next"
              placeholder="(98) 99999-9999"
              className="campo__entrada"
              aria-invalid={errors.telefone ? true : undefined}
              aria-describedby={descrito(ids.telefoneAjuda, errors.telefone && ids.telefoneErro)}
              {...telefoneCampo}
              onChange={(evento) => {
                evento.target.value = mascararDigitacaoTelefone(evento.target.value);
                if (normalizarTelefone(evento.target.value) !== telefoneVerificado.current) setJaConfirmouEm(null);
                void telefoneCampo.onChange(evento);
              }}
              onBlur={(evento) => {
                void telefoneCampo.onBlur(evento);
                void verificarTelefone(evento.target.value);
              }}
            />
            <p id={ids.telefoneAjuda} className="campo__ajuda">
              {rsvp.campos.telefoneAjuda}
            </p>
            <Erro id={ids.telefoneErro}>{errors.telefone?.message}</Erro>
          </div>

          {/* Idempotência (briefing 6.4): quem já respondeu é avisado e pode atualizar. */}
          <div aria-live="polite">
            {jaConfirmouEm && (
              <div className="aviso-rsvp">
                <p>{rsvp.jaConfirmou(jaConfirmouEm)}</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <Botao variante="contorno" onClick={() => void avancar()}>
                    {rsvp.atualizar}
                  </Botao>
                  <Link href="/" className="botao botao--texto">
                    {rsvp.manter}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {passo === 2 && (
        <fieldset className="flex flex-col gap-3" aria-describedby={descrito(errors.status && ids.statusErro)}>
          <legend className="sr-only">{rsvp.passos.vem}</legend>
          <div className="opcoes-resposta">
            <label className="opcao-resposta">
              <input type="radio" value="confirmado" className="sr-only" {...register("status")} />
              <IconeTaca tamanho={36} className="text-ouro-escuro" />
              <span className="font-display text-25 text-tinta">{rsvp.opcoes.sim}</span>
              <span className="text-14 text-fumaca">{rsvp.opcoes.simApoio}</span>
            </label>
            <label className="opcao-resposta">
              <input type="radio" value="recusou" className="sr-only" {...register("status")} />
              <IconeCarta tamanho={36} className="text-ouro-escuro" />
              <span className="font-display text-25 text-tinta">{rsvp.opcoes.nao}</span>
              <span className="text-14 text-fumaca">{rsvp.opcoes.naoApoio}</span>
            </label>
          </div>
          <Erro id={ids.statusErro}>{errors.status?.message}</Erro>
        </fieldset>
      )}

      {passo === 3 && (
        <div className="flex flex-col gap-7">
          {vem && (
            <>
              <fieldset className="campo" aria-describedby={ids.acompanhantesAjuda}>
                <legend className="campo__rotulo">{rsvp.campos.acompanhantes}</legend>
                <div className="stepper">
                  <button
                    type="button"
                    className="stepper__botao"
                    aria-label={rsvp.campos.tirarAcompanhante}
                    aria-disabled={acompanhantes.fields.length === 0 || undefined}
                    onClick={() => {
                      if (acompanhantes.fields.length > 0) acompanhantes.remove(acompanhantes.fields.length - 1);
                    }}
                  >
                    <Minus aria-hidden size={20} strokeWidth={1.5} />
                  </button>
                  <output aria-live="polite" className="stepper__valor">
                    {rsvp.campos.contagemAcompanhantes(acompanhantes.fields.length)}
                  </output>
                  <button
                    type="button"
                    className="stepper__botao"
                    aria-label={rsvp.campos.adicionarAcompanhante}
                    aria-disabled={acompanhantes.fields.length >= maxAcompanhantes || undefined}
                    onClick={() => {
                      if (acompanhantes.fields.length < maxAcompanhantes) {
                        acompanhantes.append({ nome: "" }, { shouldFocus: false });
                      }
                    }}
                  >
                    <Plus aria-hidden size={20} strokeWidth={1.5} />
                  </button>
                </div>
                <p id={ids.acompanhantesAjuda} className="campo__ajuda">
                  {rsvp.campos.acompanhantesAjuda(maxAcompanhantes)}
                </p>
                {acompanhantes.fields.length > 0 && (
                  <div className="mt-2 flex flex-col gap-4">
                    {acompanhantes.fields.map((campo, i) => {
                      const erro = errors.acompanhantes?.[i]?.nome?.message;
                      const idErro = `${id}-acomp-${i}-erro`;
                      return (
                        <div key={campo.id} className="campo">
                          <label htmlFor={`${id}-acomp-${i}`} className="campo__rotulo">
                            {rsvp.campos.nomeAcompanhante(i + 1)}
                          </label>
                          <input
                            id={`${id}-acomp-${i}`}
                            type="text"
                            autoComplete="off"
                            autoCapitalize="words"
                            enterKeyHint="next"
                            className="campo__entrada"
                            aria-invalid={erro ? true : undefined}
                            aria-describedby={descrito(erro && idErro)}
                            {...register(`acompanhantes.${i}.nome`)}
                          />
                          <Erro id={idErro}>{erro}</Erro>
                        </div>
                      );
                    })}
                  </div>
                )}
              </fieldset>

              <div className="campo">
                <label htmlFor={`${id}-convidou`} className="campo__rotulo">
                  {rsvp.campos.convidadoPor}
                </label>
                <div className="flex flex-wrap gap-2" role="group" aria-label={rsvp.campos.convidadoPorAjuda}>
                  {noivos.map((nome) => (
                    <button
                      key={nome}
                      type="button"
                      className="chip"
                      aria-pressed={convidadoPor === nome}
                      // Sem tirar o foco do campo anterior no toque: o blur mostraria um erro, a página
                      // desceria entre o toque e a soltura e o clique se perderia.
                      onPointerDown={(evento) => evento.preventDefault()}
                      onClick={() => setValue("convidadoPor", nome, { shouldValidate: true, shouldDirty: true })}
                    >
                      {nome}
                    </button>
                  ))}
                </div>
                <input
                  id={`${id}-convidou`}
                  type="text"
                  list={ids.sugestoes}
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  className="campo__entrada"
                  aria-invalid={errors.convidadoPor ? true : undefined}
                  aria-describedby={descrito(ids.convidadoPorAjuda, errors.convidadoPor && ids.convidadoPorErro)}
                  {...register("convidadoPor")}
                />
                <datalist id={ids.sugestoes}>
                  {noivos.map((nome) => (
                    <option key={nome} value={nome} />
                  ))}
                </datalist>
                <p id={ids.convidadoPorAjuda} className="campo__ajuda">
                  {rsvp.campos.convidadoPorAjuda}
                </p>
                <Erro id={ids.convidadoPorErro}>{errors.convidadoPor?.message}</Erro>
              </div>
            </>
          )}

          <div className="campo">
            <label htmlFor={`${id}-recado`} className="campo__rotulo">
              {rsvp.campos.recado}
            </label>
            <textarea
              id={`${id}-recado`}
              rows={4}
              maxLength={LIMITE_RECADO}
              enterKeyHint="send"
              className="campo__entrada campo__entrada--texto"
              aria-invalid={errors.recado ? true : undefined}
              aria-describedby={descrito(ids.recadoContador, errors.recado && ids.recadoErro)}
              {...register("recado")}
            />
            <p id={ids.recadoContador} className="campo__ajuda text-right numeros">
              {rsvp.campos.contador(recado.length, LIMITE_RECADO)}
            </p>
            <Erro id={ids.recadoErro}>{errors.recado?.message}</Erro>
          </div>
        </div>
      )}

      {envio === "falhou" || envio === "muitas-tentativas" || envio === "limite-da-sessao" ? (
        <div role="alert" className="alerta-rsvp">
          {envio === "limite-da-sessao" ? (
            <>
              <p>{rsvp.limiteSessao}</p>
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="botao botao--texto self-start"
              >
                {rsvp.limiteSessaoLink}
              </a>
            </>
          ) : (
            <>
              <p>{envio === "falhou" ? rsvp.falhaRede : rsvp.muitasTentativas}</p>
              <Botao variante="contorno" className="self-start" onClick={() => void handleSubmit(enviar)()}>
                {rsvp.tentarDeNovo}
              </Botao>
            </>
          )}
        </div>
      ) : null}

      <div className="acoes-rsvp">
        {passo > 1 && (
          <Botao
            variante="texto"
            icone={<ArrowLeft aria-hidden size={18} strokeWidth={1.5} />}
            onClick={() => irPara((passo - 1) as Passo)}
          >
            {rsvp.voltar}
          </Botao>
        )}
        <Botao
          type="submit"
          tamanho="grande"
          className="acoes-rsvp__principal"
          // Antes da hidratação o formulário é HTML puro, sem `action`: um envio nativo mandaria nome
          // e telefone para a URL (?telefone=…). Desabilitado, nem clique nem Enter enviam (DECISOES R7).
          disabled={!hidratado}
          carregando={envio === "enviando"}
          textoCarregando={rsvp.enviando}
        >
          {passo === 3 ? rsvp.enviar : rsvp.continuar}
        </Botao>
      </div>
    </form>
  );
}
