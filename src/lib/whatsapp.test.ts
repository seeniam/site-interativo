import { describe, expect, it } from "vitest";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { formatarBRL } from "./format";
import { linkComprovante, linkWhatsApp } from "./whatsapp";

describe("linkWhatsApp", () => {
  it("monta o wa.me com o número só em dígitos e o texto codificado", () => {
    const url = new URL(linkWhatsApp("55 (98) 99967-6346", "Oi! Tudo bem?"));
    expect(url.origin + url.pathname).toBe("https://wa.me/5598999676346");
    expect(url.searchParams.get("text")).toBe("Oi! Tudo bem?");
  });

  it.each(["98999676346", "123", "5598"])("recusa número sem DDI ou inválido: %s", (numero) => {
    expect(() => linkWhatsApp(numero, "x")).toThrow(RangeError);
  });
});

describe("linkComprovante (briefing 6.3)", () => {
  const ouro = casamento.presentes[2];
  const url = new URL(
    linkComprovante(
      casamento.whatsapp.numero,
      casamento.whatsapp.mensagemComprovante,
      textos.pix.comprovanteLinhas(ouro.titulo, formatarBRL(ouro.valor)),
    ),
  );
  const texto = url.searchParams.get("text") ?? "";

  it("vai para o número de comprovantes do config", () => {
    expect(url.pathname).toBe("/5598999676346");
  });

  it("leva a mensagem do casal (com o emoji, que só existe aqui), o presente com valor e o espaço do nome", () => {
    expect(texto.startsWith(casamento.whatsapp.mensagemComprovante)).toBe(true);
    expect(texto).toContain("💛");
    expect(texto).toContain(`Presente: Cota Ouro (${formatarBRL(250)})`);
    expect(texto.endsWith("Meu nome: ")).toBe(true);
  });

  it("o emoji sobrevive à codificação da URL", () => {
    expect(url.search).toContain(encodeURIComponent("💛"));
  });
});
