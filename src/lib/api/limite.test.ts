import { describe, expect, it } from "vitest";
import { criarLimitador } from "./limite";
import { criarTokenSessao, lerCookie, senhaConfere, sessaoValida } from "./sessao";

describe("criarLimitador", () => {
  it("janela deslizante: libera de novo quando a tentativa mais antiga sai da janela", () => {
    let agora = 0;
    const limitador = criarLimitador({ maximo: 2, janelaMs: 60_000, agora: () => agora });
    expect(limitador.tentar("ip").permitido).toBe(true);
    agora = 10_000;
    expect(limitador.tentar("ip").permitido).toBe(true);
    agora = 20_000;
    expect(limitador.tentar("ip")).toEqual({ permitido: false, tentarEmSegundos: 40 });
    agora = 60_000;
    expect(limitador.tentar("ip").permitido).toBe(true);
  });

  it("não guarda chaves sem fim", () => {
    const limitador = criarLimitador({ maximo: 1, janelaMs: 60_000, maximoDeChaves: 2, agora: () => 0 });
    limitador.tentar("a");
    limitador.tentar("b");
    limitador.tentar("c"); // "a" sai
    expect(limitador.tentar("a").permitido).toBe(true);
  });
});

describe("sessão", () => {
  const SEGREDO = "segredo-de-sessao-de-teste-com-32-caracteres";

  it("token assinado vale até expirar e não aceita adulteração da validade", () => {
    const token = criarTokenSessao(SEGREDO, 0);
    expect(sessaoValida(token, SEGREDO, 1)).toBe(true);
    const [versao, expira, assinatura] = token.split(".");
    expect(sessaoValida(`${versao}.${Number(expira) * 10}.${assinatura}`, SEGREDO, 1)).toBe(false);
    expect(sessaoValida(token, "", 1)).toBe(false);
    expect(sessaoValida(undefined, SEGREDO, 1)).toBe(false);
  });

  it("senhaConfere compara o conteúdo inteiro", () => {
    expect(senhaConfere("senha-certa", "senha-certa")).toBe(true);
    expect(senhaConfere("senha-cert", "senha-certa")).toBe(false);
    expect(senhaConfere("", "")).toBe(false);
  });

  it("lerCookie acha o cookie certo entre vários", () => {
    const request = new Request("http://x", { headers: { cookie: "a=1; sessao_noivos=v1.2.abc%3D; b=2" } });
    expect(lerCookie(request, "sessao_noivos")).toBe("v1.2.abc=");
    expect(lerCookie(request, "c")).toBeUndefined();
  });
});
