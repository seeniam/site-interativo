import { describe, expect, it } from "vitest";
import { ENVIOS_POR_SESSAO, atingiuLimiteDeEnvios, contarEnvio, enviosFeitos } from "./envios-da-sessao";

function memoria() {
  const dados = new Map<string, string>();
  return { getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => void dados.set(k, v) };
}

describe("envios da sessão", () => {
  it("conta envios e trava no limite", () => {
    const aba = memoria();
    for (let i = 0; i < ENVIOS_POR_SESSAO; i++) {
      expect(atingiuLimiteDeEnvios(aba)).toBe(false);
      contarEnvio(aba);
    }
    expect(enviosFeitos(aba)).toBe(ENVIOS_POR_SESSAO);
    expect(atingiuLimiteDeEnvios(aba)).toBe(true);
  });

  it("sem storage, ou com storage que lança, não trava ninguém nem quebra", () => {
    const quebrado = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
    };
    expect(atingiuLimiteDeEnvios(null)).toBe(false);
    expect(atingiuLimiteDeEnvios(quebrado)).toBe(false);
    expect(() => contarEnvio(quebrado)).not.toThrow();
  });

  it("valor estranho no storage conta como zero", () => {
    const aba = memoria();
    aba.setItem("convite:rsvp-envios", "abc");
    expect(enviosFeitos(aba)).toBe(0);
  });
});
