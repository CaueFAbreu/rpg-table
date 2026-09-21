import { normalizarPontosMedo, PONTOS_MEDO_MAX } from "./medo";

describe("normalizarPontosMedo", () => {
  test("aceita inteiros dentro do limite", () => {
    expect(normalizarPontosMedo(7)).toBe(7);
    expect(normalizarPontosMedo("12")).toBe(12);
  });

  test("nunca fica abaixo de zero", () => {
    expect(normalizarPontosMedo(-3)).toBe(0);
  });

  test("respeita o limite maximo", () => {
    expect(normalizarPontosMedo(PONTOS_MEDO_MAX + 50)).toBe(PONTOS_MEDO_MAX);
  });

  test("arredonda decimais para baixo", () => {
    expect(normalizarPontosMedo(4.9)).toBe(4);
  });

  test("retorna null para valores invalidos ou vazios", () => {
    expect(normalizarPontosMedo("")).toBeNull();
    expect(normalizarPontosMedo("abc")).toBeNull();
    expect(normalizarPontosMedo(null)).toBeNull();
    expect(normalizarPontosMedo(undefined)).toBeNull();
  });
});
