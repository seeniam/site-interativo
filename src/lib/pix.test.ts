import jsQR from "jsqr";
import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { casamento } from "@/config/casamento";
import {
  crc16Ccitt,
  crcConfere,
  ErroPix,
  gerarPayloadPix,
  lerCamposPix,
  normalizarCampoPix,
  payloadPixDoPresente,
  txidDoPresente,
  type DadosPix,
} from "./pix";

/** Exemplo de QR estático do Manual de Padrões para Iniciação do Pix (Banco Central). */
const EXEMPLO_BCB =
  "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";

const BASE: DadosPix = {
  tipoChave: "telefone",
  chave: "+5598999676346",
  nome: "JAQUELINE",
  cidade: "SAO LUIS",
  valor: 250,
  txid: "OURO",
};

/** Renderiza a matriz do QR em RGBA (4px por módulo, margem de 4 módulos) e lê com jsQR. */
function lerQr(payload: string): string | null {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
  const { size, data } = qr.modules;
  const escala = 4;
  const margem = 4;
  const lado = (size + margem * 2) * escala;
  const pixels = new Uint8ClampedArray(lado * lado * 4).fill(255);
  for (let linha = 0; linha < size; linha++) {
    for (let coluna = 0; coluna < size; coluna++) {
      if (!data[linha * size + coluna]) continue;
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const y = (linha + margem) * escala + dy;
          const x = (coluna + margem) * escala + dx;
          const i = (y * lado + x) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        }
      }
    }
  }
  return jsQR(pixels, lado, lado)?.data ?? null;
}

describe("crc16Ccitt", () => {
  it("bate com o valor de verificação do CRC-16/CCITT-FALSE ('123456789' → 29B1)", () => {
    expect(crc16Ccitt("123456789")).toBe("29B1");
  });

  it("devolve sempre 4 dígitos, com zero à esquerda", () => {
    expect(crc16Ccitt("")).toBe("FFFF");
    for (const texto of ["a", "PIX", "0002010102"]) expect(crc16Ccitt(texto)).toMatch(/^[0-9A-F]{4}$/);
  });

  it("confere o CRC do exemplo oficial do Banco Central", () => {
    expect(crc16Ccitt(EXEMPLO_BCB.slice(0, -4))).toBe("1D3D");
    expect(crcConfere(EXEMPLO_BCB)).toBe(true);
  });

  it("acusa payload adulterado", () => {
    expect(crcConfere(EXEMPLO_BCB.replace("BRASILIA", "BRASILIO"))).toBe(false);
    expect(crcConfere("123")).toBe(false);
  });
});

describe("gerarPayloadPix", () => {
  it("reproduz o exemplo do manual do Banco Central, byte a byte", () => {
    expect(
      gerarPayloadPix({
        tipoChave: "aleatoria",
        chave: "123e4567-e12b-12d1-a456-426655440000",
        nome: "Fulano de Tal",
        cidade: "BRASILIA",
      }),
    ).toBe(EXEMPLO_BCB);
  });

  it("monta o payload da Cota Ouro campo a campo, com a chave em +55", () => {
    const semCrc =
      "000201" +
      "2636" +
      "0014br.gov.bcb.pix" +
      "0114+5598999676346" +
      "52040000" +
      "5303986" +
      "5406250.00" +
      "5802BR" +
      "5909JAQUELINE" +
      "6008SAO LUIS" +
      "6208" +
      "0504OURO" +
      "6304";
    expect(gerarPayloadPix(BASE)).toBe(semCrc + crc16Ccitt(semCrc));
  });

  it("sem valor, omite o campo 54 (quem paga digita o valor)", () => {
    const campos = lerCamposPix(gerarPayloadPix({ ...BASE, valor: undefined }));
    expect(campos.has("54")).toBe(false);
  });

  it("formata o valor com ponto e duas casas", () => {
    expect(lerCamposPix(gerarPayloadPix({ ...BASE, valor: 150 })).get("54")).toBe("150.00");
    expect(lerCamposPix(gerarPayloadPix({ ...BASE, valor: 99.9 })).get("54")).toBe("99.90");
    expect(lerCamposPix(gerarPayloadPix({ ...BASE, valor: 0.01 })).get("54")).toBe("0.01");
  });

  it("aceita os limites exatos: nome com 25 e cidade com 15 caracteres", () => {
    const nome = "A".repeat(25);
    const cidade = "B".repeat(15);
    const campos = lerCamposPix(gerarPayloadPix({ ...BASE, nome, cidade }));
    expect(campos.get("59")).toBe(nome);
    expect(campos.get("60")).toBe(cidade);
  });

  describe("recusa o que o banco recusaria", () => {
    it.each<[string, Partial<DadosPix>, RegExp]>([
      ["chave de telefone crua, sem +55", { chave: "98999676346" }, /\+55/],
      ["chave de telefone com máscara", { chave: "+55 (98) 99967-6346" }, /\+55/],
      ["chave de telefone sem o 55", { chave: "+98999676346" }, /\+55/],
      ["nome com 26 caracteres", { nome: "A".repeat(26) }, /25/],
      ["cidade com 16 caracteres", { cidade: "B".repeat(16) }, /15/],
      ["nome com acento", { nome: "JAQUELINE ÁVILA" }, /acento/],
      ["cidade com acento", { cidade: "SÃO LUÍS" }, /acento/],
      ["nome vazio", { nome: "" }, /vazio/],
      ["valor zero", { valor: 0 }, /Valor/],
      ["valor negativo", { valor: -10 }, /Valor/],
      ["valor NaN", { valor: Number.NaN }, /Valor/],
      ["valor infinito", { valor: Number.POSITIVE_INFINITY }, /Valor/],
      ["txid com traço", { txid: "COTA-OURO" }, /txid/],
      ["txid com 26 caracteres", { txid: "A".repeat(26) }, /txid/],
    ])("%s", (_rotulo, alteracao, mensagem) => {
      expect(() => gerarPayloadPix({ ...BASE, ...alteracao })).toThrow(ErroPix);
      expect(() => gerarPayloadPix({ ...BASE, ...alteracao })).toThrow(mensagem);
    });

    it.each<[DadosPix["tipoChave"], string]>([
      ["cpf", "123.456.789-09"],
      ["cnpj", "12345678000"],
      ["email", "Noivos@Exemplo.com"],
      ["aleatoria", "não-é-uuid"],
    ])("chave %s fora do formato (%s)", (tipoChave, chave) => {
      expect(() => gerarPayloadPix({ ...BASE, tipoChave, chave })).toThrow(ErroPix);
    });
  });

  it("aceita os outros tipos de chave no formato certo", () => {
    for (const [tipoChave, chave] of [
      ["cpf", "12345678909"],
      ["cnpj", "12345678000195"],
      ["email", "noivos@exemplo.com"],
      ["aleatoria", "123e4567-e12b-12d1-a456-426655440000"],
    ] as const) {
      expect(crcConfere(gerarPayloadPix({ ...BASE, tipoChave, chave }))).toBe(true);
    }
  });
});

describe("normalizarCampoPix", () => {
  it.each([
    ["São Luís", "SAO LUIS"],
    ["Jaqueline d'Ávila", "JAQUELINE D AVILA"],
    ["  joão   da  silva ", "JOAO DA SILVA"],
    ["Conceição-Araújo", "CONCEICAO ARAUJO"],
  ])("%s → %s", (entrada, saida) => {
    expect(normalizarCampoPix(entrada)).toBe(saida);
  });
});

describe("PIX dos presentes do convite", () => {
  it("a chave do config está no formato do BR Code e é a mesma chave informada", () => {
    expect(casamento.pix.chaveFormatoBrCode).toBe(`+55${casamento.pix.chave}`);
    expect(casamento.pix.chaveFormatoBrCode).toBe("+5598999676346");
  });

  it("txid vem do id do presente, só letras e números", () => {
    expect(txidDoPresente({ id: "ouro" })).toBe("OURO");
    expect(txidDoPresente({ id: "jogo-de-taças" })).toBe("JOGODETAAS");
    expect(txidDoPresente({ id: "---" })).toBe("***");
  });

  it.each(casamento.presentes.map((p) => [p.titulo, p] as const))("%s gera payload válido", (_titulo, presente) => {
    const payload = payloadPixDoPresente(casamento.pix, presente);
    const campos = lerCamposPix(payload);
    expect(crcConfere(payload)).toBe(true);
    expect(campos.get("54")).toBe(presente.valor.toFixed(2));
    expect(lerCamposPix(campos.get("26") ?? "").get("01")).toBe("+5598999676346");
    expect((campos.get("59") ?? "").length).toBeLessThanOrEqual(25);
    expect((campos.get("60") ?? "").length).toBeLessThanOrEqual(15);
  });

  it.each(casamento.presentes.map((p) => [p.titulo, p] as const))(
    "o QR de %s lido de volta (jsqr) é idêntico ao payload",
    (_titulo, presente) => {
      const payload = payloadPixDoPresente(casamento.pix, presente);
      expect(lerQr(payload)).toBe(payload);
    },
  );
});

describe("lerCamposPix", () => {
  it("separa os campos do exemplo do Banco Central", () => {
    const campos = lerCamposPix(EXEMPLO_BCB);
    expect(campos.get("59")).toBe("Fulano de Tal");
    expect(campos.get("63")).toBe("1D3D");
  });

  it("acusa payload malformado", () => {
    expect(() => lerCamposPix("00AB")).toThrow(ErroPix);
  });
});

describe("valor em centavos, sem arredondar em silêncio", () => {
  it.each([0.004, 10.001, 99.999, 1.005])("recusa %d (fração de centavo)", (valor) => {
    expect(() => gerarPayloadPix({ ...BASE, valor })).toThrow(/fração de centavo/);
  });

  it.each<[number, string]>([
    [1.1, "1.10"],
    [0.1 + 0.2, "0.30"],
    [19.99, "19.99"],
    [1234567.89, "1234567.89"],
  ])("aceita %d → %s", (valor, esperado) => {
    expect(lerCamposPix(gerarPayloadPix({ ...BASE, valor })).get("54")).toBe(esperado);
  });
});

describe("chave e-mail", () => {
  it.each(["joão@exemplo.com", "noivos@exemplo", `${"a".repeat(66)}@exemplo.com`])("recusa %s", (chave) => {
    expect(() => gerarPayloadPix({ ...BASE, tipoChave: "email", chave })).toThrow(ErroPix);
  });

  it("aceita e-mail ASCII em minúsculas com até 77 caracteres", () => {
    const chave = `${"a".repeat(65)}@exemplo.com`;
    expect(chave.length).toBe(77);
    expect(crcConfere(gerarPayloadPix({ ...BASE, tipoChave: "email", chave }))).toBe(true);
  });
});
